# 16 · Build and deploy

> Path: `wiki/operations/16-build-and-deploy.md` · Section: **Operations**

## Production build

```bash
npm run build
```

Invokes `vite build`. Outputs an optimised static bundle into `dist/`
with code-split chunks. No server-side rendering — Caillou is a pure SPA.

## Preview locally

```bash
npm run build
npm run preview
```

`vite preview` serves the built `dist/` for a final smoke test.

## Hosting

Upload the contents of `dist/` to any static host:

* Netlify
* Vercel
* Cloudflare Pages
* AWS S3 + CloudFront
* GitHub Pages
* Firebase Hosting
* Any plain HTTP server with `index.html` as the entry.

The app does not require server-side rendering or server-side routing.

### Routing

Because Caillou is a single-page app, configure your host to serve
`index.html` for any unknown path (typical SPA fallback). Vite's
default `dist/index.html` handles `404` and unknown routes already.

### `sw.js`

Ensure the host serves `/sw.js` with the correct MIME type
(`application/javascript` or `text/javascript`) so the service worker
can register for push notifications.

## Environment variables

Set at build time:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_VAPID_PUBLIC_KEY`

Edge Function secrets (server-side):

* `VAPID_PRIVATE_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* Any additional keys required by the Edge Function.

See [Environment variables](./15-environment-variables.md) for the full
list and security notes.

## Edge Function

The Web Push dispatcher lives at
[`supabase/functions/push-notification/index.ts`](../../supabase/functions/push-notification/index.ts).
Deploy it via the Supabase CLI:

```bash
supabase functions deploy push-notification \
  --project-ref <project-ref>
```

Set the Edge Function's secrets before deploying:

```bash
supabase secrets set \
  VAPID_PRIVATE_KEY=... \
  SUPABASE_SERVICE_ROLE_KEY=...
```

## Database schema

There is no checked-in migration under `supabase/migrations/`. When
shipping a fresh deployment, ensure the following Postgres tables exist:

* `events` — `id`, `owner_id`, `title`, `date`, `end_date`, `start_time`,
  `end_time`, `member_ids` (text[]), `thumbnail_url`, `location`,
  `recurrence` (jsonb), `reminders` (text[]), `is_birthday`,
  `driver_id`, `exception_dates` (text[]).
* `family_members` — `id`, `owner_id`, `name`, `color`, `bg_class`,
  `icon`, `current_location` (jsonb).
* `places` — `id`, `owner_id`, `name`, `icon`.
* `settings` — `owner_id`, `start_of_week`, `time_format`.
* `user_subscriptions` — `user_id`, `subscription` (jsonb).

Recommended: enable Row-Level Security and add policies keyed on
`auth.uid() = owner_id`. See `supabase/rls.sql` if it exists in your
project.

## Post-deploy smoke test

1. Open the deployed URL.
2. Create one event as `admin`.
3. Open the same URL in a second tab and confirm realtime propagation.
4. Subscribe to push notifications via Settings; trigger a reminder
   window to verify the Edge Function fires.

---

**See also**

- [14 · Running the project](./14-running-the-project.md)
- [15 · Environment variables](./15-environment-variables.md)
- [17 · Common pitfalls](./17-common-pitfalls.md)