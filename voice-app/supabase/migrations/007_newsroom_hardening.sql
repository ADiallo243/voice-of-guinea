-- Production hardening for a public newsroom. Apply after migrations 001–006.

-- Keep exactly one published homepage feature, even when two editors save at once.
with ranked_features as (
  select id, row_number() over (order by published_at desc nulls last, created_at desc) as position
  from public.articles
  where status = 'published' and featured = true
)
update public.articles
set featured = false
where id in (select id from ranked_features where position > 1);

create unique index if not exists one_published_featured_article
on public.articles ((featured))
where status = 'published' and featured = true;

-- A headline should lead to one destination only. The server validates http(s)
-- URLs; this constraint prevents accidental dual destinations in the database.
update public.breaking_news
set external_url = null
where article_id is not null and external_url is not null;

alter table public.breaking_news
  drop constraint if exists breaking_news_has_destination;
alter table public.breaking_news
  add constraint breaking_news_has_exactly_one_destination
  check (((article_id is not null)::integer + (external_url is not null)::integer) = 1);

-- Reader-side counters are not reliable analytics and were callable by anybody.
-- Existing historical totals remain readable to newsroom staff only.
drop policy if exists "Published article view totals are public" on public.article_daily_views;
create policy "Newsroom staff can read article view totals"
on public.article_daily_views for select to authenticated
using ((select public.is_newsroom_staff()));

revoke all on function public.increment_article_view(uuid) from public, anon, authenticated;

-- Log the remaining editorial and access-sensitive changes without copying
-- subscribers' e-mail addresses into the audit log.
drop trigger if exists log_breaking_news_changes on public.breaking_news;
create trigger log_breaking_news_changes
after insert or update or delete on public.breaking_news
for each row execute function public.log_newsroom_change();

drop trigger if exists log_profile_changes on public.profiles;
create trigger log_profile_changes
after update on public.profiles
for each row execute function public.log_newsroom_change();

drop trigger if exists log_newsletter_changes on public.newsletter_subscribers;
create trigger log_newsletter_changes
after update or delete on public.newsletter_subscribers
for each row execute function public.log_newsroom_change();

-- Store only HMAC fingerprints, never raw IP addresses or e-mail addresses, for
-- the server-side newsletter rate limiter. No browser role can access this table.
create table if not exists public.newsletter_signup_limits (
  attempt_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_signup_limits enable row level security;

create or replace function public.consume_newsletter_signup_quota(attempt_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_row public.newsletter_signup_limits%rowtype;
begin
  if length(attempt_key) <> 64 then
    return false;
  end if;

  insert into public.newsletter_signup_limits (attempt_key)
  values (attempt_key)
  on conflict (attempt_key) do nothing;

  select * into limit_row
  from public.newsletter_signup_limits
  where newsletter_signup_limits.attempt_key = consume_newsletter_signup_quota.attempt_key
  for update;

  if not found then
    return false;
  end if;

  if limit_row.window_started_at <= now() - interval '1 hour' then
    update public.newsletter_signup_limits
    set window_started_at = now(), attempts = 1, updated_at = now()
    where newsletter_signup_limits.attempt_key = consume_newsletter_signup_quota.attempt_key;
    return true;
  end if;

  if limit_row.attempts >= 5 then
    return false;
  end if;

  update public.newsletter_signup_limits
  set attempts = attempts + 1, updated_at = now()
  where newsletter_signup_limits.attempt_key = consume_newsletter_signup_quota.attempt_key;
  return true;
end;
$$;

revoke all on function public.consume_newsletter_signup_quota(text) from public, anon, authenticated;
grant execute on function public.consume_newsletter_signup_quota(text) to service_role;
