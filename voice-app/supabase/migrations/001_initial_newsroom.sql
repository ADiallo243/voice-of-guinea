create extension if not exists pgcrypto;

create type public.newsroom_role as enum ('owner', 'editor', 'author');
create type public.article_status as enum ('draft', 'scheduled', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role public.newsroom_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content jsonb not null default '[]'::jsonb,
  hero_image_url text,
  hero_image_alt text not null default '',
  image_credit text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  status public.article_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_articles_need_date
    check (status <> 'scheduled' or scheduled_for is not null),
  constraint published_articles_need_date
    check (status <> 'published' or published_at is not null)
);

create table public.breaking_news (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  article_id uuid references public.articles(id) on delete cascade,
  external_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breaking_news_has_destination
    check (article_id is not null or external_url is not null)
);

create index articles_status_published_idx
  on public.articles(status, published_at desc);
create index articles_category_idx on public.articles(category_id);
create index breaking_news_active_order_idx
  on public.breaking_news(active, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();
create trigger breaking_news_updated_at before update on public.breaking_news
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_newsroom_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'editor', 'author')
  );
$$;

create or replace function public.is_newsroom_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.breaking_news enable row level security;

create policy "Profiles are visible to newsroom staff"
on public.profiles for select to authenticated
using ((select public.is_newsroom_staff()));

create policy "Managers can update newsroom profiles"
on public.profiles for update to authenticated
using ((select public.is_newsroom_manager()))
with check ((select public.is_newsroom_manager()));

create policy "Active categories are public"
on public.categories for select to anon, authenticated
using (active or (select public.is_newsroom_staff()));

create policy "Managers can create categories"
on public.categories for insert to authenticated
with check ((select public.is_newsroom_manager()));
create policy "Managers can update categories"
on public.categories for update to authenticated
using ((select public.is_newsroom_manager()))
with check ((select public.is_newsroom_manager()));
create policy "Owners can delete categories"
on public.categories for delete to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  )
);

create policy "Published articles are public"
on public.articles for select to anon, authenticated
using (
  (status = 'published' and published_at <= now())
  or (select public.is_newsroom_staff())
);

create policy "Staff can create articles"
on public.articles for insert to authenticated
with check (
  (select public.is_newsroom_staff())
  and author_id = (select auth.uid())
);
create policy "Authors can update own articles and managers can update all"
on public.articles for update to authenticated
using (
  author_id = (select auth.uid())
  or (select public.is_newsroom_manager())
)
with check (
  author_id = (select auth.uid())
  or (select public.is_newsroom_manager())
);
create policy "Managers can delete articles"
on public.articles for delete to authenticated
using ((select public.is_newsroom_manager()));

create policy "Active breaking news is public"
on public.breaking_news for select to anon, authenticated
using (
  (
    active
    and starts_at <= now()
    and (expires_at is null or expires_at > now())
  )
  or (select public.is_newsroom_staff())
);
create policy "Managers can create breaking news"
on public.breaking_news for insert to authenticated
with check ((select public.is_newsroom_manager()));
create policy "Managers can update breaking news"
on public.breaking_news for update to authenticated
using ((select public.is_newsroom_manager()))
with check ((select public.is_newsroom_manager()));
create policy "Managers can delete breaking news"
on public.breaking_news for delete to authenticated
using ((select public.is_newsroom_manager()));

insert into public.categories (name, slug, description, display_order)
values
  ('Actualités', 'actualites', 'Les faits marquants en Guinée.', 1),
  ('Culture', 'culture', 'Création, patrimoine et idées.', 2),
  ('Divertissement', 'divertissement', 'Musique, cinéma et tendances.', 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Article images are publicly readable"
on storage.objects for select to anon, authenticated
using (bucket_id = 'article-images');
create policy "Newsroom staff can upload article images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'article-images'
  and (select public.is_newsroom_staff())
);
create policy "Newsroom staff can update article images"
on storage.objects for update to authenticated
using (
  bucket_id = 'article-images'
  and (select public.is_newsroom_staff())
);
create policy "Managers can delete article images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'article-images'
  and (select public.is_newsroom_manager())
);
