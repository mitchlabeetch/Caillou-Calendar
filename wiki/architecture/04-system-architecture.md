# 04 · System architecture

> Path: `wiki/architecture/04-system-architecture.md` · Section: **Architecture**

The app is a single-page React 19 application served by Vite. All state lives in a
single `EventsContext` provider mounted in [`src/App.tsx`](../../src/App.tsx). Every
backend module is **lazy-imported** so the app boots even with no Supabase configuration.

## Five-tier layered diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                                       │
│  CalendarMonth · CalendarWeek · CalendarAgenda · Sidebar                  │
│  MemberFilterBar · AddEventModal · EventDetailModal · DayEventsModal       │
│  FamilyModal · PlacesModal · SettingsModal · SetStatusModal              │
│  ReminderSystem · EventHoverCard                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STATE CONTAINER (React Context)                                          │
│  EventsContext · useEvents()                                              │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  APPLICATION LOGIC                                                        │
│  syncEngine.ts · permissions.ts · exportIcs.ts                            │
│  googleCalendar.ts · pushNotifications.ts                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PERSISTENCE ADAPTERS                                                     │
│  localDb.ts (IndexedDB) · supabase.ts (remote) · localStorage (fallback)  │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                        │
│  Supabase (Postgres + Auth + Realtime) · Google Calendar API              │
│  Web Push / Service Worker                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

## Tier responsibilities

### 1 · Presentation layer

All files under [`src/components/`](../../src/components/). Components consume
state exclusively via the [`useEvents()`](../../src/lib/eventsContext.tsx) hook —
they never receive calendar data through props. See
[Modules → UI components](../modules/10-ui-components.md).

### 2 · State container

[`EventsContext`](../../src/lib/eventsContext.tsx) is the **only** source of
truth for events, family members, places, settings, the active user, and the
multi-select flags. See [State management](./07-state-management.md).

### 3 · Application logic

Pure or near-pure modules under [`src/lib/`](../../src/lib/):

| Module | Responsibility |
| --- | --- |
| `syncEngine.ts` | The write pipeline — `syncInsert / syncUpdate / syncDelete`. |
| `permissions.ts` | Role-based capability checks. |
| `exportIcs.ts` | RFC 5545 ICS export. |
| `googleCalendar.ts` | Push events to the user's primary Google Calendar. |
| `pushNotifications.ts` | Web Push subscription helpers. |

### 4 · Persistence adapters

| Adapter | Where | Notes |
| --- | --- | --- |
| IndexedDB | `localDb.ts` | Canonical local store. Five object stores. |
| Supabase | `supabase.ts` | Optional; falls back when env vars are absent. |
| localStorage | `App.tsx` | Legacy fallback with the `synoptic-*` keys. |

### 5 · External services

* **Supabase** — Postgres tables, Auth, Realtime channels.
* **Google Calendar API** — invoked via the Supabase session `provider_token`.
* **Web Push** — VAPID subscription + the `push-notification` Edge Function.

## Cross-cutting concerns

* **Date handling**: every event stores `date: 'YYYY-MM-DD'` strings; no
  `Date` objects. See [Modules → Type definitions](../modules/11-type-definitions.md).
* **Lazy backend imports**: required so the app boots without env vars. See
  [Sync strategy](./06-sync-strategy.md).
* **Neo-brutalist design system**: tokens declared in
  [`src/index.css`](../../src/index.css). See [Design system](../design/12-design-system.md).

---

**See also**

- [05 · Data flow](./05-data-flow.md)
- [06 · Sync strategy](./06-sync-strategy.md)
- [07 · State management](./07-state-management.md)