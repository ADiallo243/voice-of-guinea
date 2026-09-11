-- Do not keep usable unsubscribe or confirmation links in the database.
-- Existing links keep working because their SHA-256 hashes are backfilled first.
alter table public.newsletter_subscribers
  add column if not exists confirmation_token_hash text,
  add column if not exists unsubscribe_token_hash text;

update public.newsletter_subscribers
set
  confirmation_token_hash = encode(digest(confirmation_token::text, 'sha256'), 'hex'),
  unsubscribe_token_hash = encode(digest(unsubscribe_token::text, 'sha256'), 'hex')
where confirmation_token_hash is null or unsubscribe_token_hash is null;

alter table public.newsletter_subscribers
  alter column confirmation_token_hash set not null,
  alter column unsubscribe_token_hash set not null;

create unique index if not exists newsletter_confirmation_token_hash_unique
on public.newsletter_subscribers(confirmation_token_hash);
create unique index if not exists newsletter_unsubscribe_token_hash_unique
on public.newsletter_subscribers(unsubscribe_token_hash);

alter table public.newsletter_subscribers
  drop column if exists confirmation_token,
  drop column if exists unsubscribe_token;
