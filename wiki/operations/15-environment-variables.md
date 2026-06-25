# 15 · Environment variables

> Path: `wiki/operations/15-environment-variables.md` · Section: **Operations**

All client-visible variables **must** be prefixed with `VITE_`. Vite
exposes them at build time via `import.meta.env.VITE_*`.

## Variables

| Variable | Required? | Effect |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | optional | Enables Supabase client; without it the app runs in local-only mode. |
| `VITE_SUPABASE_ANON_KEY` | optional | Anon key paired with the URL. |
| `VITE_VAPID_PUBLIC_KEY` | optional | Enables Web Push subscription. The server-side `VAPID_PRIVATE_KEY` is used by the Edge Function. |
| `DISABLE_HMR` | internal | When `true`, Vite disables file watching to prevent flickering during AI Studio agent edits. **Do not modify.** |

## When vars are missing

[`getSupabase()`](../../src/lib/supabase.ts) returns `null` whenever
`VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing or malformed
(not a valid URL). The app then runs in
[local-only mode](../architecture/06-sync-strategy.md#local-only-mode)
with the synthetic `local-user` and IndexedDB + localStorage as the
sole persistence.

## Security

`VITE_*` variables are **bundled into the client JS** and are therefore
public. Never put service-role keys or private keys into a `VITE_*`
variable:

* ✅ `VITE_SUPABASE_URL` — safe.
* ✅ `VITE_SUPABASE_ANON_KEY` — safe (Supabase anon keys are designed to
  be public).
* ❌ `VITE_SUPABASE_SERVICE_ROLE_KEY` — **never**.
* ❌ `VITE_VAPID_PRIVATE_KEY` — **never** (keep this in Supabase
  Secrets for the Edge Function).

## Internal switches

`vite.config.ts` reads `process.env.DISABLE_HMR`. When `true`, file
watching is disabled to prevent flickering during AI Studio agent edits.
This is intentional — do not modify it.

## Where secrets live

| Layer | Where |
| --- | --- |
| Client (browser) | `VITE_*` variables in `.env.local` or hosting platform's build settings. |
| Edge Function | Supabase Secrets (set via `supabase secrets set`). |
| Local dev (Edge Function) | `supabase/functions/.env.local`. |

---

**See also**

- [06 · Sync strategy](../architecture/06-sync-strategy.md)
- [14 · Running the project](./14-running-the-project.md)
- [16 · Build and deploy](./16-build-and-deploy.md)