# Voice of Guinea — Supabase setup

The application is prepared for Supabase Auth, Postgres and Storage. Local demo
articles are available during development only. Production never falls back to
demo content when the database is unavailable or empty.

## 1. Create the project

1. Create a Supabase project.
2. In **SQL Editor**, run every file in `supabase/migrations/` in numerical
   order, from `001_initial_newsroom.sql` through `014_enforce_newsroom_mfa.sql`.
3. In **Authentication → Providers → Email**, disable public sign-ups. Newsroom
   accounts should be invited deliberately.
4. In **Authentication → URL Configuration**, add
   `https://www.voiceofguinea.com/auth/callback` to the allowed redirect URLs.

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

Confirmation links expire after 48 hours. Pending subscriptions that were not
confirmed are removed after 30 days by the scheduled maintenance task. The
newsroom can unsubscribe a reader on request, but cannot bypass consent by
manually turning a pending address into an active subscriber.

## 2.2 Publish scheduled articles

The deployment contains a Vercel Cron job that checks for due scheduled articles. On the Hobby plan it runs once daily, around 06:00 UTC; publish time-sensitive stories manually. Add a long, random `CRON_SECRET` to the Vercel production environment and to `.env.local`. Vercel sends this secret to the protected cron route automatically. If you upgrade to a paid plan, you can restore the five-minute schedule in `vercel.json`.

## 2.3 Protect newsroom sign-in

Migration 012 adds a persistent login throttle without storing raw IP or e-mail
addresses. Production login fails closed if its limiter cannot be reached, so
apply the migrations and configure this separate random value before enabling
production sign-in:

```env
AUTH_RATE_LIMIT_SECRET=a-different-long-random-secret
```

Do not reuse `CRON_SECRET` or `NEWSLETTER_RATE_LIMIT_SECRET`. After deployment,
the owner-only **Système** page shows whether the application can reach the
required database tables and whether each environment variable is present.

## 2.4 Require two-step newsroom sign-in

Migration 014 adds restrictive AAL2 policies to newsroom tables and Storage.
Public anonymous reads continue through their existing policies; authenticated
newsroom reads and writes require a verified second factor. The application
routes password-only sessions to `/admin/mfa`, where each staff member enrolls
and verifies a TOTP authenticator app. Enable TOTP enrollment and verification
in Supabase Auth. Apply migration 014 before deploying this version, and test
one invited account from sign-in through a successful MFA challenge. The
**Système** page checks for the migration marker but cannot confirm each
individual user's enrollment. If an owner loses their authenticator, revoke
that factor in Supabase Auth and have the owner enroll a new one at next login.

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
  `NEWSLETTER_RATE_LIMIT_SECRET`, `AUTH_RATE_LIMIT_SECRET`, and `CRON_SECRET`
  in Vercel only; never put one in a `NEXT_PUBLIC_` variable. The Turnstile
  site key is the intentional public exception.
- In Supabase Auth, disable public sign-ups, require strong passwords, enable
  leaked-password protection and TOTP factors, and restrict redirect URLs to
  your production domain. Each newsroom user must complete MFA enrollment.
- Confirm every migration through `014_enforce_newsroom_mfa.sql`
  completed before enabling the newsroom. They add newsletter safeguards, the
  featured-story invariant, audit trail, revision history, token protection,
  the author-to-editor workflow, publication validation and login throttling.
- Use Google Analytics for audience reporting; the custom database view counter
  is deliberately retired because it was not trustworthy.
