# Voice of Guinea — Supabase setup

The application is prepared for Supabase Auth, Postgres and Storage. The public
website continues to use the migrated local articles until the database is
connected and populated.

## 1. Create the project

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/migrations/001_initial_newsroom.sql`.
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

## 2.1 Publish scheduled articles

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
