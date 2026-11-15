-- Additive migration. All AI data is private; approved text is projected by the server.
create table public.naya_article_settings (
  article_id uuid primary key references public.articles(id) on delete cascade,
  disabled boolean not null default false
);
create table public.naya_summaries (
  article_id uuid not null references public.articles(id) on delete cascade,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('processing','draft','approved','rejected','error')),
  draft jsonb,
  approved jsonb,
  model text not null,
  generated_at timestamptz,
  approved_at timestamptz,
  reviewer_id uuid references public.profiles(id) on delete set null,
  processing_error text,
  created_at timestamptz not null default now(),
  primary key (article_id, content_hash),
  check (draft is null or (jsonb_typeof(draft) = 'array' and jsonb_array_length(draft) = 3)),
  check (status <> 'approved' or (approved is not null and jsonb_typeof(approved) = 'array' and jsonb_array_length(approved) = 3 and approved_at is not null and reviewer_id is not null))
);
create index naya_summaries_reviewer_idx on public.naya_summaries(reviewer_id);
create index naya_summaries_status_idx on public.naya_summaries(status, created_at);
alter table public.naya_article_settings enable row level security;
alter table public.naya_summaries enable row level security;
revoke all on public.naya_article_settings, public.naya_summaries from anon, authenticated;
grant select, insert, update on public.naya_article_settings to authenticated;
grant select, update on public.naya_summaries to authenticated;
grant all on public.naya_article_settings, public.naya_summaries to service_role;
create policy "Managers read Naya settings" on public.naya_article_settings for select to authenticated using ((select public.is_newsroom_manager()));
create policy "Managers insert Naya settings" on public.naya_article_settings for insert to authenticated with check ((select public.is_newsroom_manager()));
create policy "Managers update Naya settings" on public.naya_article_settings for update to authenticated using ((select public.is_newsroom_manager())) with check ((select public.is_newsroom_manager()));
create policy "Managers read summaries" on public.naya_summaries for select to authenticated using ((select public.is_newsroom_manager()));
create policy "Managers review summaries" on public.naya_summaries for update to authenticated using ((select public.is_newsroom_manager())) with check ((select public.is_newsroom_manager()) and (status <> 'approved' or reviewer_id = (select auth.uid())));

create table public.naya_usage (
  fingerprint text primary key check (length(fingerprint) = 64),
  used integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.naya_usage enable row level security;
revoke all on public.naya_usage from anon, authenticated;
grant all on public.naya_usage to service_role;
-- Invoker permissions and explicit grants keep this service-only. Atomic row locks
-- protect the global budget and individual quota across concurrent server instances.
create function public.consume_naya_quota(fingerprint text, daily_limit integer, global_limit integer default 1000)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  global_key text := lpad('global:' || (now() at time zone 'UTC')::date::text, 64, '0');
  global_used integer;
  visitor_used integer;
begin
  if length(fingerprint) <> 64 or daily_limit not between 1 and 20 or global_limit not between 1 and 10000 then return false; end if;
  insert into public.naya_usage(fingerprint) values(global_key) on conflict do nothing;
  select used into global_used from public.naya_usage where naya_usage.fingerprint = global_key for update;
  if global_used >= global_limit then return false; end if;
  insert into public.naya_usage(fingerprint) values(consume_naya_quota.fingerprint) on conflict do nothing;
  select used into visitor_used from public.naya_usage where naya_usage.fingerprint = consume_naya_quota.fingerprint for update;
  if visitor_used >= daily_limit then return false; end if;
  update public.naya_usage set used = used + 1, updated_at = now() where naya_usage.fingerprint in (global_key, consume_naya_quota.fingerprint);
  return true;
end;
$$;
revoke all on function public.consume_naya_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_naya_quota(text, integer, integer) to service_role;
