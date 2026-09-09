-- Prevent an editor (or a direct database request) from publishing content that
-- is missing the information required for a credible public news article.
create or replace function public.ensure_article_publication_ready()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('published', 'scheduled') and (
    new.category_id is null
    or new.hero_image_url is null
    or new.hero_image_alt is null or btrim(new.hero_image_alt) = ''
    or new.image_credit is null or btrim(new.image_credit) = ''
    or jsonb_typeof(new.content) <> 'array'
    or jsonb_array_length(new.content) < 3
  ) then
    raise exception 'Published or scheduled articles need a category, image, image description, image credit, and at least three content blocks.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_article_publication_readiness on public.articles;
create trigger require_article_publication_readiness
before insert or update on public.articles
for each row execute function public.ensure_article_publication_ready();

-- A persistent, server-only login throttle. Keys are HMAC fingerprints created
-- by the application; this table never stores a raw e-mail address or IP.
create table if not exists public.login_attempt_limits (
  attempt_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

alter table public.login_attempt_limits enable row level security;

create or replace function public.consume_login_attempt_quota(attempt_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_row public.login_attempt_limits%rowtype;
begin
  if length(attempt_key) <> 64 then
    return false;
  end if;

  insert into public.login_attempt_limits (attempt_key)
  values (attempt_key)
  on conflict (attempt_key) do nothing;

  select * into limit_row
  from public.login_attempt_limits
  where login_attempt_limits.attempt_key = consume_login_attempt_quota.attempt_key
  for update;

  if limit_row.window_started_at <= now() - interval '15 minutes' then
    update public.login_attempt_limits
    set window_started_at = now(), attempts = 1, updated_at = now()
    where login_attempt_limits.attempt_key = consume_login_attempt_quota.attempt_key;
    return true;
  end if;

  if limit_row.attempts >= 5 then
    return false;
  end if;

  update public.login_attempt_limits
  set attempts = attempts + 1, updated_at = now()
  where login_attempt_limits.attempt_key = consume_login_attempt_quota.attempt_key;
  return true;
end;
$$;

revoke all on function public.consume_login_attempt_quota(text) from public, anon, authenticated;
grant execute on function public.consume_login_attempt_quota(text) to service_role;
