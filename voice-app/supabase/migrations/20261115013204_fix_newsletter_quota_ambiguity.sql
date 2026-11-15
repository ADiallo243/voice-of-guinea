-- Fix parameter/column ambiguity in both persistent, server-only throttles.
-- No rows are deleted and no quotas are disabled. Function signatures stay stable.

grant select, insert, update on public.newsletter_signup_limits to service_role;
create or replace function public.consume_newsletter_signup_quota(attempt_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  limit_row public.newsletter_signup_limits%rowtype;
begin
  if length(attempt_key) <> 64 then
    return false;
  end if;

  insert into public.newsletter_signup_limits (attempt_key)
  values (consume_newsletter_signup_quota.attempt_key)
  on conflict do nothing;

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


grant select, insert, update on public.login_attempt_limits to service_role;
create or replace function public.consume_login_attempt_quota(attempt_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  limit_row public.login_attempt_limits%rowtype;
begin
  if length(attempt_key) <> 64 then
    return false;
  end if;

  insert into public.login_attempt_limits (attempt_key)
  values (consume_login_attempt_quota.attempt_key)
  on conflict do nothing;

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

