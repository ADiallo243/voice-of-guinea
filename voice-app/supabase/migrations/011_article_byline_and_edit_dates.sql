-- Public editorial attribution and an explicit substantive-edit timestamp.
alter table public.articles
  add column if not exists byline text,
  add column if not exists last_edited_at timestamptz;

alter table public.articles
  drop constraint if exists articles_byline_length;
alter table public.articles
  add constraint articles_byline_length check (byline is null or char_length(byline) <= 120);

-- `updated_at` is an internal database timestamp. Keep the public-facing date
-- separate, and set it only when an already-published article changes.
create or replace function public.set_article_last_edited_at()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' and new.status = 'published' and (
    new.title is distinct from old.title or
    new.slug is distinct from old.slug or
    new.byline is distinct from old.byline or
    new.excerpt is distinct from old.excerpt or
    new.content is distinct from old.content or
    new.hero_image_url is distinct from old.hero_image_url or
    new.hero_image_alt is distinct from old.hero_image_alt or
    new.image_credit is distinct from old.image_credit or
    new.category_id is distinct from old.category_id or
    new.featured is distinct from old.featured or
    new.published_at is distinct from old.published_at or
    new.correction_note is distinct from old.correction_note or
    new.seo_title is distinct from old.seo_title or
    new.seo_description is distinct from old.seo_description
  ) then
    new.last_edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_article_last_edited_at on public.articles;
create trigger set_article_last_edited_at
before update on public.articles
for each row execute function public.set_article_last_edited_at();
