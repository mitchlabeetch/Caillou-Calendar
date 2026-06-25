# 08 · Entry and root

> Path: `wiki/modules/08-entry-and-root.md` · Section: **Modules**

This page documents the two files that bootstrap the entire application.

## `src/main.tsx` — entry point

[`src/main.tsx`](../../src/main.tsx) is the Vite entry. It performs four
one-time side effects before mounting `<App />`:

1. Imports [`./lib/i18n`](../../src/lib/i18n.ts) to initialise `i18next`
   synchronously.
2. Initialises the `mobile-drag-drop` polyfill with
   `holdToDrag: 300ms` so touch devices can drag events.
3. Adds a passive `touchmove` listener — required to make drag-and-drop
   work on some mobile browsers. Removing it breaks touch DnD
   (pitfall [#4](../operations/17-common-pitfalls.md#4--removing-mobile-drag-drop-from-maintsx)).
4. Registers `/sw.js` as a service worker. The SW handles
   `notificationclick` only — it does **not** cache assets.

```ts
// Side-effect order matters — do not reorder.
import './lib/i18n';
import 'mobile-drag-drop';              // holdToDrag = 300
window.addEventListener('touchmove', () => {}, { passive: true });
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## `src/App.tsx` — root component

[`src/App.tsx`](../../src/App.tsx) is the default export. It accepts an
optional `timeZone` prop (default `'Europe/Paris'`) and is responsible for:

| Concern | Where |
| --- | --- |
| Owning global state (view, currentDate, modals, multi-select, toast) | `useState` calls at the top of the file. |
| Bootstrapping Supabase auth + realtime subscriptions | `useEffect` calling `import('./lib/supabase')`. |
| Hydrating IndexedDB → state, then migrating `localStorage` entries | `useEffect` calling `localDb.get*`. |
| Wiring keyboard shortcuts (`←/→`, `Shift+←/→`, `M/W/T`, `1–9`) | `useEffect` with `addEventListener('keydown', ...)`. |
| Rendering header, sidebar, calendar views, modals and the global toast | JSX in the default export. |
| Wrapping everything in `<EventsContext.Provider>` | Last JSX node before `</>`. |

### Bootstrap sequence

```text
1. Mount with empty state.
2. useEffect — hydrate IndexedDB → state.
3. useEffect — if Supabase configured:
     a. signInWithEmail / signInWithGoogle / getSession.
     b. Fetch remote events/family/places/settings.
     c. Reconcile with local snapshot.
     d. Open postgres_changes subscription.
4. useEffect — register window 'online' listener for queue flush.
5. useEffect — install keyboard shortcut listeners.
6. useEffect — mirror state to IndexedDB on every change.
```

### State mirrors

Each persisted slice has a one-line `useEffect`:

```ts
useEffect(() => { localDb.setEvents(events); }, [events]);
useEffect(() => { localDb.setFamilyMembers(familyMembers); }, [familyMembers]);
useEffect(() => { localDb.setPlaces(places); }, [places]);
useEffect(() => { localDb.setSettings(settings); }, [settings]);
```

> Removing any of these effects will cause the local database to fall out
> of sync with React state. This is **not** an optimisation opportunity.

---

**See also**

- [01 · Introduction](../overview/01-introduction.md)
- [Modules → Library modules](./09-library-modules.md)
- [Modules → UI components](./10-ui-components.md)
- [Operations → Common pitfalls](../operations/17-common-pitfalls.md)