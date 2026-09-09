# Voice of Guinea — pre-publication checklist

This checklist supports a responsible launch. It is not a substitute for advice from a lawyer qualified in the country where the publisher is established or actively targets readers.

## Identity and editorial responsibility

- [ ] Replace the remaining editorial identity note in `/mentions-legales` with the publisher's legal name, full business or professional address, and the named publication director where required.
- [ ] Confirm that `voiceofguinea@gmail.com` is monitored for corrections, privacy and accessibility requests.
- [ ] Confirm the editorial standards, corrections process and sponsored-content policy match the newsroom's actual practice.
- [ ] Keep written proof of the licence, permission or public-domain status for every image, video and third-party asset.

## Privacy and cookies

- [ ] In a private-browser window, reject cookies and confirm that no request is sent to `googletagmanager.com` or Google Analytics.
- [ ] Accept analytics and confirm that GA4 receives an anonymous page view without email addresses, names, phone numbers or other personal information.
- [ ] Use **Gérer mes cookies** in the footer, refuse, and confirm that `_ga` cookies are removed.
- [ ] Set GA4 data retention deliberately and review data sharing, Google Signals and advertising-personalization settings. Keep advertising features disabled unless there is a documented need and suitable consent.
- [ ] Implement and document a retention process for unsubscribed newsletter records.
- [ ] Add newsletter double opt-in before sending newsletters at scale.

## Accessibility and publishing quality

- [ ] Perform a keyboard-only review of the home page, article page, search, newsletter form, cookie banner and admin login.
- [ ] Review colour contrast, focus visibility and mobile layout at 320px width.
- [ ] Test core pages with a screen reader and a real reader with accessibility needs before claiming WCAG 2.2 AA conformance.
- [ ] Require an accurate alt text and image credit before an editor can publish.
- [ ] Require sources, byline, category, publication date and correction note when appropriate.

## Google and operations

- [ ] Verify a **Domain property** in Google Search Console through DNS.
- [ ] Submit `https://www.voiceofguinea.com/sitemap.xml` and `https://www.voiceofguinea.com/news-sitemap.xml`.
- [ ] Inspect the home page and several published articles in Search Console after deployment.
- [ ] Add `CRON_SECRET` in Vercel and confirm a scheduled test article is published at the expected time.
- [ ] Apply every Supabase migration, including `006_storage_path_policies.sql`.
- [ ] Set two-factor authentication for Vercel, Supabase, Google and the GitHub repository; restrict admin roles to the people who need them.
