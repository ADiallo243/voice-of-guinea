alter table public.profiles
add column if not exists active boolean not null default true;

create or replace function public.is_newsroom_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'owner'
      and active = true
  );
$$;

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
      and active = true
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
      and active = true
  );
$$;

drop policy if exists "Managers can update newsroom profiles" on public.profiles;

create policy "Owners can update newsroom profiles"
on public.profiles for update to authenticated
using ((select public.is_newsroom_owner()))
with check ((select public.is_newsroom_owner()));
