# 06 · Sync strategy

> Path: `wiki/architecture/06-sync-strategy.md` · Section: **Architecture**

The app is designed to function **identically** with or without a backend. When
[`VITE_SUPABASE_URL`](../../.env.example) / [`VITE_SUPABASE_ANON_KEY`](../../.env.example) are
absent or malformed, [`getSupabase()`](../../src/lib/supabase.ts) returns
`null` and the app runs in **local-user** mode against IndexedDB +
localStorage.

## Mode matrix

| Mode | Trigger | Storage | Realtime | Auth |
| --- | --- | --- | --- | --- |
| **Local-only** | Missing/invalid Supabase env vars | IndexedDB (`caillou-calendar`) | None | Synthetic `local-user` |
| **Supabase** | Both env vars set and URL-shaped | IndexedDB **and** Postgres tables | `postgres_changes` channel | Email/password or Google OAuth |
| **Offline + queued** | Supabase present but `navigator.onLine === false` | IndexedDB + `outbound_sync_queue` | Paused | Last known session |

## Lazy import pattern (mandatory)

All modules that talk to Supabase are imported **inside** effects or
callbacks via `import('./lib/supabase')`. A top-level import would crash
the app when env vars are missing — this is **pitfall #1** in
[Common pitfalls](../operations/17-common-pitfalls.md#1--top-level-import).

```ts
// ✅ Correct — lazy import inside useEffect
useEffect(() => {
  import('./lib/supabase').then((s) => {
    const sb = s.getSupabase();
    if (!sb) {
      setUser({ uid: 'local-user', email: 'local@example.com' });
      return;
    }
    sb.auth.getSession().then(/* ... */);
  });
}, []);

// ❌ Wrong — crashes the app without env vars
import { getSupabase } from './lib/supabase';
```

## Local-only mode

When `getSupabase()` returns `null`:

* The active user is the synthetic `'local-user'`.
* All writes go to IndexedDB only.
* Reads hydrate from IndexedDB on mount.
* `localStorage` is used as a compatibility shim for the `synoptic-*` keys
  defined in [`AGENTS.md`](../../AGENTS.md).

This mode is the default in **Google AI Studio** when no env vars have been
provisioned.

## Supabase mode

When both env vars are present:

* A Supabase client is memoised and reused for the session lifetime.
* Reads reconcile IndexedDB and Postgres snapshots via `dbRowToEvent()`,
  `dbRowToMember()`, `dbRowToSettings()`.
* Writes go directly to Postgres; failures are enqueued in
  `outbound_sync_queue`.
* Realtime subscriptions stay open for the duration of the session.

## Offline + queued

Triggered when the browser fires `online` ↔ `offline` events while
Supabase is configured. Writes accumulate in `outbound_sync_queue`. The
[`App.tsx`](../../src/App.tsx) component listens for `online` and calls
[`flushOutboundSyncQueue()`](../../src/lib/syncEngine.ts) which retries
each entry and removes successes.

---

**See also**

- [04 · System architecture](./04-system-architecture.md)
- [05 · Data flow](./05-data-flow.md)
- [Modules → Library modules → syncEngine](../modules/09-library-modules.md#syncengine--src-libsyncenginets-the-write-pipeline)
- [15 · Environment variables](../operations/15-environment-variables.md)