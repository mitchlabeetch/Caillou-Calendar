# 11 · Type definitions

> Path: `wiki/modules/11-type-definitions.md` · Section: **Modules**

The canonical model lives in [`src/types.ts`](../../src/types.ts). Every other
module imports its types from here — do not redefine them.

## Full type definitions

```ts
export type FamilyMember = {
  id: string;
  name: string;
  color: string;        // legacy key like 'bg-mem-1'
  bgClass: string;      // Tailwind background class
  icon: string;         // lucide-react component name
  currentLocation?: { text: string; icon: string; updatedAt?: string };
};

export type Place = {
  id: string;
  name: string;
  icon?: string;
};

export type Recurrence = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string;     // YYYY-MM-DD
  count?: number;
};

export type Reminder = '15m' | '1h' | '1d';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;                   // YYYY-MM-DD, INCLUSIVE
  endDate?: string;               // YYYY-MM-DD, INCLUSIVE in UI
  startTime?: string;             // HH:mm
  endTime?: string;               // HH:mm
  memberIds: string[];
  thumbnailUrl?: string;
  location?: string;
  recurrence?: Recurrence;
  reminders?: Reminder[];
  isBirthday?: boolean;           // forces recurrence.type = 'yearly'
  driverId?: string;
  exceptionDates?: string[];      // dates skipped from a recurring pattern
};

export type AppSettings = {
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;   // 0 = Sunday
  timeFormat: '12h' | '24h';
};

export type UserRole = 'admin' | 'member' | 'child';
```

## Conventions

| Rule | Notes |
| --- | --- |
| Dates are ISO strings | `YYYY-MM-DD`. Hydrate with `parseISO` from `date-fns`. |
| Times are `HH:mm` | 24-hour by default; formatted by `AppSettings.timeFormat`. |
| Event IDs are not UUIDs | Generated via `Math.random().toString(36).substring(7)`. |
| `endDate` is inclusive in UI | Only the Google Calendar adapter adds +1 day to make it exclusive. |
| `isBirthday` implies `recurrence.type === 'yearly'` | The dropdown is disabled in the UI when the birthday checkbox is on. |
| `exceptionDates` skip occurrences | Always ISO strings; honoured by `getDayEvents()`. |
| `memberIds` is the source of truth for membership | The `familyMembers` table mirrors the IDs, not the other way around. |

## Legacy aliases

Some DB columns and persisted keys use snake_case (`start_time`,
`end_time`, `member_ids`, `is_birthday`). The mapping happens in
[`src/lib/supabase.ts`](../../src/lib/supabase.ts) via:

* `eventToDbRow(event)` — camelCase → snake_case for writes.
* `dbRowToEvent(row)` — snake_case → camelCase for reads.

Do not bypass these helpers. Field drift between the JS and SQL models is
the most common cause of "the UI shows the right data but Supabase shows
the old data" bugs.

## Where each type is used

| Type | Primary consumers |
| --- | --- |
| `FamilyMember` | `Sidebar`, `FamilyModal`, `AddEventModal`, `MemberFilterBar`, `EventHoverCard`, `supabase.ts`. |
| `Place` | `PlacesModal`, `AddEventModal`, `SetStatusModal`. |
| `Recurrence` | `AddEventModal`, `getDayEvents()`. |
| `Reminder` | `AddEventModal`, `ReminderSystem`, `pushNotifications.ts`. |
| `CalendarEvent` | Every calendar view, every modal, every lib module. |
| `AppSettings` | `App.tsx`, `SettingsModal`. |
| `UserRole` | `permissions.ts`, `App.tsx` (state). |

---

**See also**

- [09 · Library modules → eventsContext](./09-library-modules.md#eventscontext--src-libeventscontexttsx-react-context-contract)
- [07 · State management](../architecture/07-state-management.md)
- [17 · Common pitfalls](../operations/17-common-pitfalls.md)