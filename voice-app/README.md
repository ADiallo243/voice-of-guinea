# Voice of Guinea newsroom

The production newsroom is a Next.js application with Supabase for editorial
content, staff access, revisions and newsletter subscriptions. The older static
HTML files at the repository root are only the previous site; they are not this
application.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the Supabase values from `.env.example` to `.env.local`. Follow
`BACKEND_SETUP.md` to create the database and newsroom accounts. The production
site intentionally shows no sample articles when the database is unavailable.

## Publish to the existing domain

In the existing Vercel project:

1. Open **Settings → General → Root Directory**.
2. Set it to `voice-app` and save.
3. In **Settings → Environment Variables**, add every required production value
   from `.env.example` and `BACKEND_SETUP.md`. Keep secrets server-only; do not
   add them to GitHub.
4. Apply the Supabase migrations in order, through
   `011_article_byline_and_edit_dates.sql`.
5. Deploy the `main` branch, then attach `www.voiceofguinea.com` to that Vercel
   project if it is not already connected.

Changing the Root Directory is essential: without it, Vercel deploys the old
static site at the repository root, which uses `.html` links and cannot expose
the CMS or the new application routes.

Use `PRE_PUBLISH_CHECKLIST.md` before making the deployment public.
