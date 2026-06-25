# 09 · Library modules

> Path: `wiki/modules/09-library-modules.md` · Section: **Modules**

A reference for every file under [`src/lib/`](../../src/lib/) and the related
[`src/hooks/`](../../src/hooks/) directory. Each subsection follows the same
shape: **responsibility · exports · pitfalls · see also**.

---

## `supabase.ts` — [`src/lib/supabase.ts`](../../src/lib/supabase.ts)

**Lazy client + row mappers.**

* Exposes a memoised `getSupabase()` singleton. Returns `null` when env
  vars are missing or malformed.
* Provides snake_case ↔ camelCase mappers for every persisted table:
  `eventToDbRow / dbRowToEvent`,
  `memberToDbRow / dbRowToMember`,
  `settingsToDbRow / dbRowToSettings`.
* Auth helpers: `signInWithGoogle`, `signInWithEmail`,
  `signUpWithEmail`, `signOut`.
* Opens a single `postgres_changes` channel per owner_id.

> ⚠️ **Pitfall #1**: do **not** import this file at the top level of any
> module. Always lazy-import via `import('./lib/supabase')`.

---

## `eventsService.ts` — [`src/lib/eventsService.ts`](../../src/lib/eventsService.ts) — Supabase wrappers

Despite the `*Firestore` suffix, this file **uses Supabase, not Firebase**.
Do not add real Firestore logic here.

Exports include (names preserve the historical `Firestore` suffix):

* `addEventToFirestore / updateEventInFirestore / deleteEventFromFirestore`
* `addFamilyMemberToFirestore / updateFamilyMemberInFirestore / deleteFamilyMemberFromFirestore`
* `addPlaceToFirestore / updatePlaceInFirestore / deletePlaceFromFirestore`
* `saveSettingsToFirestore`

The `*Firestore` suffix exists for historical reasons and would be a
breaking rename — keep it for now.

---

## `localDb.ts` — [`src/lib/localDb.ts`](../../src/lib/localDb.ts)

**IndexedDB wrapper + outbound queue.**

* Opens the `caillou-calendar` database (version 1) with five object
  stores: `events`, `family_members`, `places`, `settings`,
  `outbound_sync_queue`.
* Typed CRUD helpers: `getEvents / setEvents`, `getFamilyMembers /
  setFamilyMembers`, `getPlaces / setPlaces`, `getSettings /
  setSettings`.
* Queue helpers: `enqueueSync`, `getOutboundQueue`, `clearOutboundQueue`,
  `flushOutboundSyncQueue`.

### Outbound queue lifecycle

```text
write fails (offline / Supabase absent / rejected)
   → enqueueSync({ table, op, payload, ts })
   → store in outbound_sync_queue

window 'online' event
   → flushOutboundSyncQueue()
   → for each entry: try remote write, on success delete entry
```

---

## `syncEngine.ts` — [`src/lib/syncEngine.ts`](../../src/lib/syncEngine.ts)

**The write pipeline.**

Three core helpers — `syncInsert / syncUpdate / syncDelete` — plus a
re-export of `flushOutboundSyncQueue`. Each helper attempts a direct
remote write first and falls back to the IndexedDB queue if Supabase is
absent, offline, or rejects the request.

| Argument | Type | Notes |
| --- | --- | --- |
| `table` | `'events' \| 'family_members' \| 'places' \| 'settings'` | Persisted table name. |
| `op` | `'insert' \| 'update' \| 'delete'` | Mutation kind. |
| `payload` | `Record<string, unknown>` | Full row or partial update. |
| `id` | `string` | Required for `update` / `delete`. |

---

## `permissions.ts` — [`src/lib/permissions.ts`](../../src/lib/permissions.ts)

**Role-based capability checks.**

Pure functions over the `UserRole` enum:

* `canCreateEvent(role)`
* `canEditEvent(event, role, userId)` — children only if `userId ∈ event.memberIds`
* `canDeleteEvent(event, role, userId)`
* `canManageFamily(role)`
* `canManagePlaces(role)`
* `canManageSettings(role)`
* `canBulkDelete(role)`

See [State management → Permissions matrix](../architecture/07-state-management.md#permissions-matrix)
for the full table.

---

## `exportIcs.ts` — [`src/lib/exportIcs.ts`](../../src/lib/exportIcs.ts)

**RFC 5545 ICS export.**

* Builds a VCALENDAR with one VEVENT per record.
* Escapes commas, semicolons and newlines per RFC 5545.
* Expands `memberIds` to a comma-separated description.
* Triggers a browser download named `family_calendar.ics`.
* All-day events use `DTSTART;VALUE=DATE`.

---

## `googleCalendar.ts` — [`src/lib/googleCalendar.ts`](../../src/lib/googleCalendar.ts)

**Push to the user's primary Google Calendar.**

`pushEventsToGoogleCalendar(events)` reads the Supabase session's
`provider_token` (scoped to
`https://www.googleapis.com/auth/calendar.events`) and `POST`s each event
to `/calendar/v3/calendars/primary/events`. All-day events are converted
to Google's exclusive end-date format by adding one day.

> If the token is missing, sync fails with a toast error.

---

## `pushNotifications.ts` — [`src/lib/pushNotifications.ts`](../../src/lib/pushNotifications.ts)

**Web Push subscription helpers.**

* Uses `VITE_VAPID_PUBLIC_KEY` to subscribe via `PushManager`.
* Persists the subscription in the `user_subscriptions` table.
* The matching Supabase Edge Function at
  [`supabase/functions/push-notification/index.ts`](../../supabase/functions/push-notification/index.ts)
  reads new events and dispatches web-push messages to all subscribers.

---

## `i18n.ts` — [`src/lib/i18n.ts`](../../src/lib/i18n.ts)

**i18next bootstrap.**

Configures `i18next` with `LanguageDetector` and
`initReactI18next`; bundles 6 translations from
[`src/locales/*.json`](../../src/locales/). `fallbackLng` is English.

---

## `dateLocale.ts` — [`src/lib/dateLocale.ts`](../../src/lib/dateLocale.ts)

**date-fns locale mapper.**

`getDateLocale(lang)` returns the matching `date-fns` locale object based
on the prefix of the active language, falling back to `enUS`.

```ts
getDateLocale('fr') // → fr
getDateLocale('es-MX') // → es
getDateLocale('xx') // → enUS
```

---

## `utils.ts` — [`src/lib/utils.ts`](../../src/lib/utils.ts)

**Shared helpers.**

* `cn(...inputs)` — `clsx` + `tailwind-merge`.
* `hasSchedulingConflict(a, b)` — same-day, overlapping time, shared member.
* `getConflictsForEvent(draft, all)` — for live conflict warnings inside
  `AddEventModal`.

---

## `eventsContext.tsx` — [`src/lib/eventsContext.tsx`](../../src/lib/eventsContext.tsx)

**React Context contract.**

Defines `EventsContextType`, exports `EventsContext` and the `useEvents()`
hook (which throws if used outside the provider).

**Always** use this hook — never pass calendar data down through props.
See [State management](../architecture/07-state-management.md).

---

## `hooks/useIsMobile.ts` — [`src/hooks/useIsMobile.ts`](../../src/hooks/useIsMobile.ts)

**Responsive helper.**

Returns a boolean reflecting the `(max-width: 640px)` media query. Used
to switch between `CalendarAgenda` (mobile) and the month/week grid
(desktop).

---

## Module dependency graph (high level)

```text
App.tsx
  ├── lib/eventsContext.tsx          (Context type, hook)
  ├── lib/supabase.ts                (lazy: getSupabase)
  ├── lib/localDb.ts                 (IndexedDB)
  ├── lib/syncEngine.ts              (write pipeline)
  │     └── lib/supabase.ts          (lazy)
  ├── lib/permissions.ts             (pure)
  ├── lib/i18n.ts                    (side-effecting)
  ├── lib/dateLocale.ts              (pure)
  ├── lib/utils.ts                   (pure)
  ├── lib/exportIcs.ts               (pure)
  ├── lib/googleCalendar.ts          (lazy: supabase)
  ├── lib/pushNotifications.ts       (lazy: supabase)
  └── components/                    (useEvents())
```

No circular imports. Backend modules are only ever reached lazily, so the
app can boot without Supabase configuration.

---

**See also**

- [07 · State management](../architecture/07-state-management.md)
- [11 · Type definitions](./11-type-definitions.md)
- [Modules → Entry and root](./08-entry-and-root.md)
- [16 · Build and deploy](../operations/16-build-and-deploy.md)