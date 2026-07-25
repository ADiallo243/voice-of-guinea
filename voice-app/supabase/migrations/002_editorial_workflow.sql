create table public.article_daily_views (
  article_id uuid not null references public.articles(id) on delete cascade,
  viewed_on date not null default current_date,
  views bigint not null default 0 check (views >= 0),
  primary key (article_id, viewed_on)
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index article_views_date_idx on public.article_daily_views(viewed_on desc);
create index activity_log_created_idx on public.activity_log(created_at desc);

alter table public.article_daily_views enable row level security;
alter table public.activity_log enable row level security;

create policy "Published article view totals are public"
on public.article_daily_views for select to anon, authenticated
using (
  exists (
    select 1 from public.articles
    where articles.id = article_daily_views.article_id
      and articles.status = 'published'
      and articles.published_at <= now()
  )
  or (select public.is_newsroom_staff())
);

create policy "Newsroom staff can read activity"
on public.activity_log for select to authenticated
using ((select public.is_newsroom_staff()));

create or replace function public.increment_article_view(target_article uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.articles
    where id = target_article
      and status = 'published'
      and published_at <= now()
  ) then
    insert into public.article_daily_views (article_id, viewed_on, views)
    values (target_article, current_date, 1)
    on conflict (article_id, viewed_on)
    do update set views = article_daily_views.views + 1;
  end if;
end;
$$;

grant execute on function public.increment_article_view(uuid) to anon, authenticated;

create or replace function public.log_newsroom_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  target_id := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.activity_log (actor_id, action, entity_type, entity_id)
  values ((select auth.uid()), lower(tg_op), tg_table_name, target_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger log_article_changes
after insert or update or delete on public.articles
for each row execute function public.log_newsroom_change();

create trigger log_category_changes
after insert or update or delete on public.categories
for each row execute function public.log_newsroom_change();

drop policy if exists "Staff can create articles" on public.articles;
drop policy if exists "Authors can update own articles and managers can update all" on public.articles;

create policy "Staff can create permitted articles"
on public.articles for insert to authenticated
with check (
  (select public.is_newsroom_staff())
  and author_id = (select auth.uid())
  and (
    (select public.is_newsroom_manager())
    or (
      status = 'draft'
      and featured = false
    )
  )
);

create policy "Staff can update permitted articles"
on public.articles for update to authenticated
using (
  author_id = (select auth.uid())
  or (select public.is_newsroom_manager())
)
with check (
  (select public.is_newsroom_manager())
  or (
    author_id = (select auth.uid())
    and status = 'draft'
    and featured = false
  )
);
