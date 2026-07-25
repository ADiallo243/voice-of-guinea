create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'unsubscribed')),
  source text not null default 'website',
  confirmation_token uuid not null default gen_random_uuid() unique,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  consent_at timestamptz not null default now(),
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_unique
on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_created_idx
on public.newsletter_subscribers (status, created_at desc);

drop trigger if exists newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_updated_at
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Managers can read newsletter subscribers"
on public.newsletter_subscribers;
create policy "Managers can read newsletter subscribers"
on public.newsletter_subscribers for select to authenticated
using ((select public.is_newsroom_manager()));

drop policy if exists "Managers can update newsletter subscribers"
on public.newsletter_subscribers;
create policy "Managers can update newsletter subscribers"
on public.newsletter_subscribers for update to authenticated
using ((select public.is_newsroom_manager()))
with check ((select public.is_newsroom_manager()));

drop policy if exists "Owners can delete newsletter subscribers"
on public.newsletter_subscribers;
create policy "Owners can delete newsletter subscribers"
on public.newsletter_subscribers for delete to authenticated
using ((select public.is_newsroom_owner()));
