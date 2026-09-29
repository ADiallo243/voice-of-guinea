-- Keep malformed content from raising a database function error during the
-- publication check. jsonb_array_length() only accepts arrays, so check the
-- JSON type before asking for its length in a separate IF statement.
create or replace function public.ensure_article_publication_ready()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('published', 'scheduled') then
    if new.category_id is null
      or new.hero_image_url is null
      or new.hero_image_alt is null or btrim(new.hero_image_alt) = ''
      or new.image_credit is null or btrim(new.image_credit) = ''
    then
      raise exception 'Published or scheduled articles need a category, image, image description, image credit, and at least three content blocks.';
    end if;

    if jsonb_typeof(new.content) is distinct from 'array' then
      raise exception 'Published or scheduled articles need a category, image, image description, image credit, and at least three content blocks.';
    end if;

    if jsonb_array_length(new.content) < 3 then
      raise exception 'Published or scheduled articles need a category, image, image description, image credit, and at least three content blocks.';
    end if;
  end if;

  return new;
end;
$$;

create table if not exists public.newsroom_security_checks (
  check_name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.newsroom_security_checks enable row level security;
insert into public.newsroom_security_checks (check_name)
values ('article_publication_guard')
on conflict (check_name) do update set applied_at = now();
