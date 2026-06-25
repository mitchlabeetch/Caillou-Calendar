# 10 · UI components

> Path: `wiki/modules/10-ui-components.md` · Section: **Modules**

A reference for every file under [`src/components/`](../../src/components/).
Components consume state exclusively via the
[`useEvents()`](../../src/lib/eventsContext.tsx) hook.

---

## Calendar views

### `CalendarMonth.tsx` — [`src/components/CalendarMonth.tsx`](../../src/components/CalendarMonth.tsx)

Month grid (7×5/6 cells) with per-day event pills.

* Single-click a day → opens `DayEventsModal`.
* Double-click a day → opens the inline quick-add input.
* Drag an event pill → `moveEvent(id, newDate, newTime?)`.
* Drop an event on another event → `swapEvents(idA, idB)`.
* Recurring events are expanded on the fly inside `getDayEvents()`.

### `CalendarWeek.tsx` — [`src/components/CalendarWeek.tsx`](../../src/components/CalendarWeek.tsx)

Time-grid (7 AM – 9 PM, 60-minute rows) with absolutely-positioned events.

* Cluster + side-by-side layout for overlapping events.
* Resize bottom handle adjusts duration.
* Double-click an hour → opens quick-add for that hour.

### `CalendarAgenda.tsx` — [`src/components/CalendarAgenda.tsx`](../../src/components/CalendarAgenda.tsx)

Mobile list grouped by date with the primary member's colour.

* Today / tomorrow header chips.
* Shows `startTime`, location and member avatars.

---

## Modal dialogs

All modals use `AnimatePresence` + `motion.div` from `motion/react`, mount
on `role="dialog"` and respond to Escape via the global handler in
[`App.tsx`](../../src/App.tsx).

### `AddEventModal.tsx` — [`src/components/AddEventModal.tsx`](../../src/components/AddEventModal.tsx)

Triggered by the floating "+" button (admin only).

Fields:

* `title`, `location`, `thumbnailUrl`
* `date` + `endDate`, `startTime` + `endTime`
* `recurrence` (`none` / `daily` / `weekly` / `monthly` / `yearly`)
* `reminders` (`15m` / `1h` / `1d`)
* `isBirthday` (forces `recurrence.type === 'yearly'`)
* `memberIds` (multi-select)
* `driverId`
* `exceptionDates` (for recurring events)
* Conflict warnings via `getConflictsForEvent()`.
* Auto-complete suggestions (chronologically recent titles).
* Title NLP parsing via `chrono-node`.

### `EventDetailModal.tsx` — [`src/components/EventDetailModal.tsx`](../../src/components/EventDetailModal.tsx)

Triggered by clicking an event pill.

* Read-only view with quick edit, per-event ICS download, delete.

### `DayEventsModal.tsx` — [`src/components/DayEventsModal.tsx`](../../src/components/DayEventsModal.tsx)

Triggered by single-click on a day cell.

* Scrollable list of that day's events sorted by start time.

### `FamilyModal.tsx` — [`src/components/FamilyModal.tsx`](../../src/components/FamilyModal.tsx)

Triggered from the sidebar's "Manage Family".

* Add / rename / recolor / reicon / delete members.

### `PlacesModal.tsx` — [`src/components/PlacesModal.tsx`](../../src/components/PlacesModal.tsx)

Triggered from the sidebar's "Manage Locations".

* Add / rename / reicon named places.

### `SettingsModal.tsx` — [`src/components/SettingsModal.tsx`](../../src/components/SettingsModal.tsx)

Triggered from the sidebar's "Settings".

* Language, start-of-week, time format, push toggle.

### `SetStatusModal.tsx` — [`src/components/SetStatusModal.tsx`](../../src/components/SetStatusModal.tsx)

Triggered from the sidebar status tile or context menu.

* Preset locations (Home, School, Work, Gym…) or custom text + icon.

---

## Auxiliary UI

### `Sidebar.tsx` — [`src/components/Sidebar.tsx`](../../src/components/Sidebar.tsx)

* Collapsible (90 ↔ 280 px).
* Reorderable family member chips using `Reorder.Group` from Framer Motion.
* Status grid showing `currentLocation` per member.
* Settings / Places / Family / Logout buttons.
* Right-click on a member opens a context menu (edit / change icon / delete).

### `MemberFilterBar.tsx` — [`src/components/MemberFilterBar.tsx`](../../src/components/MemberFilterBar.tsx)

Sticky horizontal filter strip above the calendar. Clicking a member
toggles `selectedMembers`. Keyboard shortcut: keys `1`–`9`.

### `EventHoverCard.tsx` — [`src/components/EventHoverCard.tsx`](../../src/components/EventHoverCard.tsx)

Absolutely-positioned tooltip on every event pill. Shows time, location,
member avatars, recurrence and reminder count.

### `ReminderSystem.tsx` — [`src/components/ReminderSystem.tsx`](../../src/components/ReminderSystem.tsx)

Polls every 10 seconds. When a reminder window crosses the current time:

1. Fires an OS / service-worker notification via
   [`pushNotifications.ts`](../../src/lib/pushNotifications.ts).
2. Surfaces an in-app toast in the global toast stack.

---

## Component dependency summary

| Component | Reads | Writes |
| --- | --- | --- |
| `CalendarMonth` | `events`, `familyMembers`, `selectedMembers` | `moveEvent`, `swapEvents`, `setSelectedEventId` |
| `CalendarWeek` | `events`, `familyMembers`, `selectedMembers` | `moveEvent`, `swapEvents` |
| `CalendarAgenda` | `events`, `familyMembers` | (read-only) |
| `AddEventModal` | `events`, `familyMembers`, `places` | `setEvents` (via context) |
| `EventDetailModal` | `events`, `familyMembers` | `setEvents` |
| `DayEventsModal` | `events`, `familyMembers` | (read-only) |
| `FamilyModal` | `familyMembers` | `addFamilyMember` / `updateFamilyMember` / `deleteFamilyMember` |
| `PlacesModal` | `places` | `addPlace` / `updatePlace` / `deletePlace` |
| `SettingsModal` | `settings`, `i18n.language` | `updateSettings` |
| `SetStatusModal` | `places`, `familyMembers` | `updateFamilyMember.currentLocation` |
| `Sidebar` | `familyMembers`, `places`, `user` | `updateFamilyMember.currentLocation` |
| `MemberFilterBar` | `familyMembers`, `selectedMembers` | `toggleMember` |
| `EventHoverCard` | (props) | (none) |
| `ReminderSystem` | `events`, `settings`, `familyMembers` | (notification side-effect) |

---

**See also**

- [08 · Entry and root](./08-entry-and-root.md)
- [09 · Library modules](./09-library-modules.md)
- [12 · Design system](../design/12-design-system.md)