# Voice of Guinea — Supabase setup

The application is prepared for Supabase Auth, Postgres and Storage. Local demo
articles are available during development only. Production never falls back to
demo content when the database is unavailable or empty.

## 1. Create the project

1. Create a Supabase project.
2. In **SQL Editor**, run every file in `supabase/migrations/` in numerical
   order, from `001_initial_newsroom.sql` through `010_hash_newsletter_tokens.sql`.
3. In **Authentication → Providers → Email**, disable public sign-ups. Newsroom
   accounts should be invited deliberately.

## 2. Connect the local application

Copy `.env.example` to `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is safe for the browser because all database and storage
access is protected by Row Level Security. Never put a Supabase secret key in a
variable beginning with `NEXT_PUBLIC_`.

Restart `npm run dev` after changing environment variables.

## 2.1 Newsletter and anti-spam

The newsletter uses double opt-in: an address remains pending until the reader
opens the confirmation link and confirms it. In Vercel Production, set all of:

```env
RESEND_API_KEY=...
NEWSLETTER_FROM_EMAIL=Voice of Guinea <newsroom@voiceofguinea.com>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
NEWSLETTER_RATE_LIMIT_SECRET=a-long-random-secret
```

Create a Cloudflare Turnstile widget for your production domain and place its
site key and secret above. The server refuses public newsletter requests in
production if Turnstile or the rate-limit secret is missing. `NEWSLETTER_RATE_LIMIT_SECRET`
is used only to create irreversible HMAC fingerprints for rate limiting; raw IP
addresses and e-mail addresses are not stored for this purpose.

## 2.2 Publish scheduled articles

The deployment contains a Vercel Cron job that checks for due scheduled articles every five minutes. Add a long, random `CRON_SECRET` to the Vercel production environment and to `.env.local`. Vercel sends this secret to the protected cron route automatically. The available cron frequency depends on your Vercel plan; if five-minute scheduling is unavailable, change the schedule in `vercel.json` to the most frequent interval your plan supports.

## 3. Create the owner

1. Create the first user in **Authentication → Users**.
2. In **SQL Editor**, assign the owner role:

```sql
update public.profiles
set role = 'owner', full_name = 'Your name'
where id = (
  select id from auth.users where email = 'your-email@example.com'
);
```

3. Open `/admin/login` and sign in.

New invited accounts receive no newsroom role by default. An owner or editor
must explicitly assign a role before the account can access content. This
prevents an accidentally enabled public sign-up from granting newsroom access.

## Roles

- **Owner:** complete newsroom control.
- **Editor:** articles, categories and breaking news.
- **Author:** creates and edits their own articles.

## Production security checklist

- Keep `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
  `NEWSLETTER_RATE_LIMIT_SECRET`, and `CRON_SECRET` in Vercel only; never put
  one in a `NEXT_PUBLIC_` variable.
- In Supabase Auth, disable public sign-ups, require strong passwords, enable
  leaked-password protection and MFA for every owner and editor, and restrict
  redirect URLs to your production domain.
- Confirm the `007_newsroom_hardening.sql` through
  `010_hash_newsletter_tokens.sql` migrations completed before enabling the
  newsroom. They add the newsletter safeguards, featured-story invariant,
  audit trail, revision history, token protection, and author-to-editor review workflow.
- Use Google Analytics for audience reporting; the custom database view counter
  is deliberately retired because it was not trustworthy.
