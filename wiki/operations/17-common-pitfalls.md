# 17 · Common pitfalls

> Path: `wiki/operations/17-common-pitfalls.md` · Section: **Operations**

Ten mistakes to avoid when modifying this codebase. Each one is a real
bug that has caused regressions.

## 1 · Top-level import

**Pitfall**: `import { getSupabase } from './lib/supabase'` at the top
of any module.

**Fix**: Always lazy-import inside `useEffect` / callbacks. Otherwise
the app crashes without env vars.

```ts
// ❌ Wrong
import { getSupabase } from './lib/supabase';
useEffect(() => { getSupabase()?.from('events')... }, []);

// ✅ Right
useEffect(() => {
  import('./lib/supabase').then((s) => s.getSupabase()?.from('events')...);
}, []);
```

## 2 · Treating `endDate` as exclusive

**Pitfall**: Off-by-one when iterating `endDate` for loops or generating
notifications.

**Fix**: `endDate` is **inclusive** in the UI. Only the
[Google Calendar adapter](../modules/09-library-modules.md#googlecalendar--src-libgooglecalendarts-push-to-the-users-primary-google-calendar)
converts to exclusive by adding one day (Google's requirement).

## 3 · Setting recurrence on a birthday

**Pitfall**: Trying to set `recurrence.type = 'monthly'` on a birthday
event.

**Fix**: Toggling the birthday checkbox forces
`recurrence.type = 'yearly'`. The dropdown is disabled in the UI; do not
re-enable it without reworking the birthday semantics.

## 4 · Removing `mobile-drag-drop` from `main.tsx`

**Pitfall**: Removing the polyfill or the passive `touchmove` listener
during a "cleanup" pass.

**Fix**: Both are required for touch drag-and-drop. Without them the app
appears broken on mobile. See
[Entry and root](../modules/08-entry-and-root.md).

## 5 · Treating `eventsService` as Firebase

**Pitfall**: Adding Firebase / Firestore logic to `eventsService.ts`
because the function names end in `Firestore`.

**Fix**: Despite the `*Firestore` suffix, the file uses **Supabase**. Do
not add real Firestore code. If you need a rename, do it in a breaking
release and update every call site.

## 6 · Running `npm run clean` on Windows

**Pitfall**: `rm -rf dist` fails or has unexpected behaviour.

**Fix**: The script is Unix-only. On Windows use:

```bash
rmdir /s /q dist
del server.js 2>nul
```

## 7 · Persisting state before checking `user.uid`

**Pitfall**: Calling `localDb.setEvents(...)` for a `local-user` write
and then trying to push it to a remote that does not exist.

**Fix**: Local-only writes skip the sync engine entirely. There is no
Supabase user to enqueue against — the outbound queue is only used when
`getSupabase()` returns a real client.

## 8 · Adding keys to one locale only

**Pitfall**: Adding a new translation key to `en.json` but forgetting
the other five files.

**Fix**: The app silently falls back to English when a key is missing —
translations disappear without warnings. Update all six files. See
[Internationalization](../design/13-internationalization.md).

## 9 · Using `Date` objects for event dates

**Pitfall**: `event.date = new Date()` instead of an ISO string.

**Fix**: Events store ISO strings (`YYYY-MM-DD`). Use `parseISO` from
`date-fns` to hydrate them and `formatISO` to serialise.

```ts
import { parseISO, formatISO } from 'date-fns';

const d = parseISO(event.date);
const iso = formatISO(d, { representation: 'date' }); // → 'YYYY-MM-DD'
```

## 10 · Modifying `vite.config.ts` HMR logic

**Pitfall**: "Cleaning up" the `DISABLE_HMR` branch in `vite.config.ts`.

**Fix**: The `DISABLE_HMR` switch exists to prevent flickering in AI
Studio. Don't touch it. See [Environment variables](./15-environment-variables.md#internal-switches).

---

**See also**

- [06 · Sync strategy](../architecture/06-sync-strategy.md)
- [08 · Entry and root](../modules/08-entry-and-root.md)
- [11 · Type definitions](../modules/11-type-definitions.md)
- [14 · Running the project](./14-running-the-project.md)