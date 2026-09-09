-- A focused newsroom workflow: draft → review → editor decision → publish.
alter type public.article_status add value if not exists 'in_review' after 'draft';
alter type public.article_status add value if not exists 'needs_changes' after 'draft';

alter table public.articles
  add column if not exists source_notes text,
  add column if not exists editorial_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

-- Revision history is a compact immutable snapshot of the pre-edit article.
create table if not exists public.article_revisions (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (article_id, revision_number)
);

create index if not exists article_revisions_article_created_idx
on public.article_revisions(article_id, created_at desc);

alter table public.article_revisions enable row level security;
create policy "Newsroom staff can read article revisions"
on public.article_revisions for select to authenticated
using ((select public.is_newsroom_staff()));

create or replace function public.capture_article_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision integer;
begin
  select coalesce(max(revision_number), 0) + 1 into next_revision
  from public.article_revisions
  where article_id = old.id;

  insert into public.article_revisions (article_id, revision_number, snapshot, changed_by)
  values (old.id, next_revision, to_jsonb(old), (select auth.uid()));
  return new;
end;
$$;

drop trigger if exists capture_article_revision on public.articles;
create trigger capture_article_revision
before update on public.articles
for each row execute function public.capture_article_revision();
