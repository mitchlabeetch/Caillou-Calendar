# 02 · Feature matrix

> Path: `wiki/overview/02-feature-matrix.md` · Section: **Overview**

A complete inventory of the user-facing features supported by the current
codebase. The list is derived from inspecting the components under
[`src/components/`](../../src/components/) and the entry points
[`src/main.tsx`](../../src/main.tsx) / [`src/App.tsx`](../../src/App.tsx).

## Calendar views

| Feature | Implemented in | Notes |
| --- | --- | --- |
| Month view | [`CalendarMonth.tsx`](../../src/components/CalendarMonth.tsx) | 7×5/6 grid; click → `DayEventsModal`, double-click → inline quick-add. |
| Week view | [`CalendarWeek.tsx`](../../src/components/CalendarWeek.tsx) | Time-grid with overlapping event clustering. |
| Agenda view | [`CalendarAgenda.tsx`](../../src/components/CalendarAgenda.tsx) | Mobile list grouped by date. |
| Print mode | [`index.css`](../../src/index.css) (`@media print`) | Hides interactive chrome, strips shadows. |

## Event management

| Feature | Implemented in | Notes |
| --- | --- | --- |
| Quick add | `CalendarMonth` / `CalendarWeek` | Double-click a day cell to invoke inline chrono-NLP parsing. |
| Drag-and-drop | `CalendarMonth`, `CalendarWeek` | Move events across days; drop on another event to swap. |
| Multi-select / bulk delete | `App.tsx` + `EventsContext` | `isMultiSelectMode` flag gates the bulk UI. |
| Recurring events | `types.ts` + `getDayEvents()` | Daily / weekly / monthly / yearly; expanded on-the-fly. |
| Exception dates | `CalendarEvent.exceptionDates` | Dates skipped from a recurring pattern. |
| Birthdays | `AddEventModal` | `isBirthday: true` forces `recurrence.type === 'yearly'`. |
| Reminders | `ReminderSystem` + `pushNotifications.ts` | `15m` / `1h` / `1d` options. |
| Conflict detection | `utils.ts` (`hasSchedulingConflict`) | Live warnings in `AddEventModal`. |

## Family & places

| Feature | Implemented in | Notes |
| --- | --- | --- |
| Reorderable members | `Sidebar.tsx` | Uses `Reorder.Group` from Framer Motion. |
| Member colours | `index.css` | `mem-1` … `mem-4` tokens. |
| Status presets | `SetStatusModal.tsx` | Home, School, Work, Gym, etc. |
| Named places | `PlacesModal.tsx` | Per-event location, used as status presets. |

## Sync & export

| Feature | Implemented in | Notes |
| --- | --- | --- |
| Supabase realtime | [`supabase.ts`](../../src/lib/supabase.ts) | `postgres_changes` channel filtered by `owner_id`. |
| Google Calendar push | [`googleCalendar.ts`](../../src/lib/googleCalendar.ts) | Uses Supabase session `provider_token`. |
| ICS export | [`exportIcs.ts`](../../src/lib/exportIcs.ts) | RFC 5545 compliant `.ics` download. |
| Web Push | [`pushNotifications.ts`](../../src/lib/pushNotifications.ts) + `supabase/functions/push-notification/index.ts` | VAPID-based. |
| Offline write queue | `localDb.ts` + `syncEngine.ts` | `outbound_sync_queue` store; flushed on `online` event. |

## Internationalisation & accessibility

| Feature | Implemented in | Notes |
| --- | --- | --- |
| 6 locales | [`src/locales/`](../../src/locales/) | `en`, `fr`, `es`, `de`, `it`, `pt`. |
| Locale-aware dates | [`dateLocale.ts`](../../src/lib/dateLocale.ts) | Maps `i18n.language` to `date-fns` locales. |
| Keyboard shortcuts | `App.tsx` | `←/→`, `Shift+←/→`, `M/W/T`, `1–9`. |
| Touch DnD | [`main.tsx`](../../src/main.tsx) | `mobile-drag-drop` polyfill with 300 ms hold. |
| Modal a11y | all modals | `role="dialog"` + `AnimatePresence`. |

## Permission model

See [Architecture → State management → Permissions matrix](../architecture/07-state-management.md#permissions-matrix).

Roles: `admin` / `member` / `child` (defined in [`src/types.ts`](../../src/types.ts)).

---

**See also**

- [01 · Introduction](./01-introduction.md)
- [03 · Tech stack](./03-tech-stack.md)
- [10 · UI components](../modules/10-ui-components.md)