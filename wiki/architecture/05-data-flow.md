# 05 · Data flow

> Path: `wiki/architecture/05-data-flow.md` · Section: **Architecture**

All mutations follow the same three-step pattern: **update React state →
enqueue sync → write to IndexedDB**. The UI never blocks on the network.

## Write path

```text
┌────────────────────┐
│  User action       │  drag · click · submit
└─────────┬──────────┘
          ▼
┌────────────────────┐
│  Component         │  AddEventModal, CalendarMonth drag, etc.
│  callback          │
└─────────┬──────────┘
          ▼
┌────────────────────┐
│  EventsContext     │  setEvents / addFamilyMember / moveEvent / ...
│  setter            │
└─────────┬──────────┘
          ▼
┌────────────────────────────────────────────────────────────────┐
│  In parallel:                                                  │
│   • useEffect in App.tsx mirrors to IndexedDB                  │
│     via localDb.setEvents(...)                                 │
│   • syncEngine.syncInsert / syncUpdate / syncDelete            │
│     ├─ Supabase configured & online → REST write               │
│     └─ otherwise → push to outbound_sync_queue in IndexedDB     │
└────────────────────────────────────────────────────────────────┘
          ▼
┌────────────────────────────────────────────────────────────────┐
│  window 'online' event → flushOutboundSyncQueue()              │
│   drains queue, retries failed ops, clears successes           │
└────────────────────────────────────────────────────────────────┘
```

### Key behaviours

* **Optimistic UI** — the React state updates synchronously, so the user
  sees the change immediately.
* **Offline-tolerant** — the queue in `outbound_sync_queue` survives
  reloads.
* **Single owner** — every payload is tagged with `owner_id` derived from
  the Supabase session or `'local-user'`.

## Read path

```text
┌────────────────────┐
│  App.tsx mount     │
└─────────┬──────────┘
          ▼
┌──────────────────────────────────────────────┐
│  localDb.getEvents()   (fast, offline-safe)  │
└─────────┬────────────────────────────────────┘
          ▼
┌──────────────────────────────────────────────┐
│  if Supabase session exists:                 │
│   • fetch events / family_members / places   │
│   • dbRowToEvent() reconciles snake_case     │
│   • open postgres_changes channel            │
└─────────┬────────────────────────────────────┘
          ▼
┌──────────────────────────────────────────────┐
│  getDayEvents() in CalendarMonth / Week      │
│   filters in-memory list, expands            │
│   recurring events on the fly                │
│   (no pre-computed instances)                │
└──────────────────────────────────────────────┘
```

### Realtime reconciliation

A single `postgres_changes` subscription per owner_id is opened in
[`supabase.ts`](../../src/lib/supabase.ts). Every insert/update/delete
triggers a re-fetch, so all open tabs stay in sync without manual diffing.

## Special cases

| Case | Behaviour |
| --- | --- |
| Drag across days | `moveEvent(id, newDate, newTime?)` updates state + IndexedDB + remote. |
| Drop on another event | `swapEvents(idA, idB)` — both events update `date` and `startTime`/`endTime`. |
| Recurring exceptions | `exceptionDates: string[]` skipped during on-the-fly expansion. |
| All-day events | Stored with `endDate` inclusive in UI; converted to exclusive (+1 day) for Google Calendar. |

---

**See also**

- [04 · System architecture](./04-system-architecture.md)
- [06 · Sync strategy](./06-sync-strategy.md)
- [Modules → Library modules → syncEngine](../modules/09-library-modules.md#syncengine--src-libsyncenginets-the-write-pipeline)