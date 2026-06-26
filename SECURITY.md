# Security Policy

## Supported versions

| Version | Supported           |
|---------|---------------------|
| 0.1.x   | ✅ active           |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.
Email the maintainers (see `package.json` `author` field) directly, or
open a private advisory via the **Security → Advisories** tab.

We aim to acknowledge reports within 3 business days and to ship a
fix or mitigation within 30 days for severity "high" or above.

## Threat model

Caillou Calendar is a single-page app that:

- Persists events in IndexedDB (per-user, scoped by `local-user` ID or
  Supabase `auth.uid`).
- Syncs events, family members, and places to Supabase tables
  protected by row-level security keyed on `owner_id`.
- Pushes events to Google Calendar via the Supabase OAuth
  `provider_token` only when the user explicitly clicks
  "Sync to Google".
- Subscribes to realtime updates via `postgres_changes` on
  tables the current user owns.
- Sends web-push notifications via a Supabase Edge Function that
  validates a server-trusted role (`admin` / `member` / `child`)
  before fan-out.

## Hardening

| Layer            | Control                                                                |
|------------------|------------------------------------------------------------------------|
| Authentication   | Supabase OAuth (Google). Anonymous local-only mode is supported.       |
| Authorization    | Row-level security on every Supabase table.                            |
| Data validation  | `validateEventInput` (src/lib/eventValidation.ts) on every write path. |
| Output rendering | No `dangerouslySetInnerHTML`. All strings pass through `i18next`.      |
| CSP              | Strict default-src 'self', wss://*.supabase.co for realtime.          |
| Permissions      | `Permissions-Policy: geolocation=(), camera=(), microphone=(), …`.     |
| Cache isolation  | IndexedDB is user-scoped; sign-out purges the active scope.            |
| Push security    | Edge Function validates RBAC and rate-limits per recipient.            |
| Build supply     | npm CI lockfile + `npm audit --production --audit-level=high` weekly. |
| Bundle integrity | No third-party scripts loaded at runtime; CSP forbids inline scripts.  |

## Out of scope

- Compromised user devices (we cannot defend against a local attacker
  with full disk access).
- Supabase itself: we trust Supabase to provide RLS enforcement and
  identity management.
- Google Calendar: once an event is pushed there, it is governed by
  Google's security model.