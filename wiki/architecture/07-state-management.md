# 07 · State management

> Path: `wiki/architecture/07-state-management.md` · Section: **Architecture**

[`src/App.tsx`](../../src/App.tsx) owns **all** core state:

* `events: CalendarEvent[]`
* `familyMembers: FamilyMember[]`
* `places: Place[]`
* `settings: AppSettings`
* `user: User | null`
* `userRole: UserRole`
* `selectedMembers: string[]`
* `isMultiSelectMode: boolean`
* `selectedEventIdsForDelete: string[]`
* `droppedEventId: string | null`

State is exposed via the [`EventsContext`](../../src/lib/eventsContext.tsx)
provider. Components **always** consume state via the `useEvents()` hook —
calendar data is **never** passed down through props.

## `EventsContextType` surface

```ts
export interface EventsContextType {
  // Events
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newDate: string, newTime?: string) => void;
  swapEvents: (idA: string, idB: string) => void;

  // Family members
  familyMembers: FamilyMember[];
  addFamilyMember: (m: FamilyMember) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  reorderFamilyMembers: (members: FamilyMember[]) => void;

  // Places
  places: Place[];
  addPlace: (p: Place) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // UX
  showToast: (msg: string) => void;
  selectedMembers: string[];
  toggleMember: (id: string) => void;
  setSelectedEventId: (id: string | null) => void;
  isMultiSelectMode: boolean;
  selectedEventIdsForDelete: string[];
  toggleEventSelectionForDelete: (id: string) => void;
  droppedEventId: string | null;
  triggerDropAnimation: (id: string) => void;

  // Auth / RBAC
  userRole: UserRole;
}
```

Source: [`src/lib/eventsContext.tsx`](../../src/lib/eventsContext.tsx).

## Permissions matrix

The [`permissions.ts`](../../src/lib/permissions.ts) module exposes pure
functions over the `UserRole` enum (`'admin' | 'member' | 'child'`):

| Action | `admin` | `member` | `child` |
| --- | :---: | :---: | :---: |
| Create event | ✅ | ✅ | ❌ |
| Edit / delete own event | ✅ | ✅ | only if tagged |
| Bulk delete | ✅ | ❌ | ❌ |
| Manage family | ✅ | ❌ | ❌ |
| Manage places | ✅ | ✅ | ❌ |
| Manage settings | ✅ | ❌ | ❌ |

> **Child rule**: a child can edit / delete only events whose
> `memberIds` include their own ID. `canEditEvent(event, role, userId)`
> enforces this.

## Hook contract

```ts
const { events, addFamilyMember, moveEvent, /* ... */ } = useEvents();
```

`useEvents()` throws if invoked outside the provider. Components rendered
outside the provider must either be wrapped by `<EventsContext.Provider>`
or be lifted inside the existing provider in [`App.tsx`](../../src/App.tsx).

## Persistence mirror

Every state slice has a matching `useEffect` in
[`App.tsx`](../../src/App.tsx) that mirrors it to IndexedDB via the
helpers in [`localDb.ts`](../../src/lib/localDb.ts):

```ts
useEffect(() => { localDb.setEvents(events); }, [events]);
useEffect(() => { localDb.setFamilyMembers(familyMembers); }, [familyMembers]);
useEffect(() => { localDb.setPlaces(places); }, [places]);
useEffect(() => { localDb.setSettings(settings); }, [settings]);
```

After the IndexedDB write, `syncEngine` is invoked to push to the
remote (if configured).

---

**See also**

- [04 · System architecture](./04-system-architecture.md)
- [05 · Data flow](./05-data-flow.md)
- [Modules → Library modules → permissions](../modules/09-library-modules.md#permissions--src-libpermissionsts-role-based-capability-checks)
- [Modules → Library modules → eventsContext](../modules/09-library-modules.md#eventscontext--src-libeventscontexttsx-react-context-contract)