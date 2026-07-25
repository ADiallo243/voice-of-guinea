alter table public.articles
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists correction_note text;

alter table public.profiles
  add column if not exists slug text,
  add column if not exists job_title text,
  add column if not exists bio text;

create unique index if not exists profiles_slug_unique
on public.profiles (slug) where slug is not null;
