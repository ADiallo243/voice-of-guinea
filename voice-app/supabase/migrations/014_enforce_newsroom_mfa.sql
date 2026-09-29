-- Require a verified second factor for every authenticated newsroom request.
-- Anonymous public reads keep using their existing policies. Service-role
-- server jobs bypass RLS as intended.
do $migration$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'categories',
    'articles',
    'breaking_news',
    'article_daily_views',
    'activity_log',
    'newsletter_subscribers',
    'article_revisions',
    'newsletter_signup_limits',
    'login_attempt_limits'
  ] loop
    execute format('drop policy if exists newsroom_require_aal2 on public.%I', target_table);
    execute format(
      'create policy newsroom_require_aal2 on public.%I as restrictive for all to authenticated using ((select auth.jwt() ->> ''aal'') = ''aal2'') with check ((select auth.jwt() ->> ''aal'') = ''aal2'')',
      target_table
    );
  end loop;
end;
$migration$;

create table if not exists public.newsroom_security_checks (
  check_name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.newsroom_security_checks enable row level security;
insert into public.newsroom_security_checks (check_name)
values ('newsroom_mfa_aal2')
on conflict (check_name) do update set applied_at = now();

drop policy if exists newsroom_storage_require_aal2 on storage.objects;
create policy newsroom_storage_require_aal2
on storage.objects as restrictive for all to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2')
with check ((select auth.jwt() ->> 'aal') = 'aal2');
