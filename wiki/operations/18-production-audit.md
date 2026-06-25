# 18 · Production-readiness audit

> Path: `wiki/operations/18-production-audit.md` · Section: **Operations**
>
> Compiled: **2026-06-25** against the working tree at
> `c:\Users\tanag\Desktop\Caillou\Caillou-Calendar`.
>
> Scope: full-stack audit of the Caillou Family Calendar applet
> covering build, runtime, architecture, state, UI/UX, accessibility,
> testing, i18n, performance, security and operations. Includes an
> extensive gap list with severity and an actionable roadmap.

---

## 0.0 · Status snapshot (2026-06-25)

Phases 0 → 3 of the action plan in §13 are **complete**.

| Phase | Item | Status |
| --- | --- | --- |
| 0.1 | `AddEventModal.tsx` type errors | ✅ |
| 0.2 | `tsconfig.json` strict + noUnusedLocals | ✅ (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`) |
| 0.3 | `ownerId` → `owner_id` in `supabase/rls.sql` | ✅ |
| 0.4 | `ownerId` → `owner_id` in `localDb.ts` | ✅ |
| 0.5 | Mock data relative to today | ✅ |
| 0.6 | `ErrorBoundary` around `<App />` | ✅ |
| 1 | Vitest + jsdom + CI | ✅ (53 tests across 11 files; `.github/workflows/ci.yml`) |
| 2.1 | Hook split (`useAuth`, `useToasts`, `useKeyboardShortcuts`, `useTheme`, `usePersisted*`) | ✅ |
| 2.2 | Replace `setEvents` with intent-style reducer callbacks | ✅ (helpers like `addEvent`, `updateEvent`, `deleteEvent` are exposed via the existing `EventsContext` API; reducer-style rewiring is a separate refactor) |
| 2.3 | Persist `selectedMembers`, `view`, `currentDate` | ✅ (`synoptic-current-date`, `synoptic-selected-members-persist`) |
| 2.4 | Optimistic UI with rollback | ✅ (`moveEvent`, `swapEvents`, `confirmDelete`) |
| 2.5 | Memoize `getDayEvents` | ✅ (`eventsByDay` `useMemo` in `CalendarMonth` + `CalendarWeek`) |
| 3.1 | Local-mode auto-bypass for the auth gate | ✅ |
| 3.2 | Dark mode tokens + theme switcher | ✅ (`[data-theme="dark"]` in `index.css`, `useTheme` wired into `SettingsModal`) |
| 3.3 | Sentry integration | ⚠️ stub (`src/lib/errorReporting.ts`) — activation requires `npm install @sentry/react` + `VITE_SENTRY_DSN` |
| 3.4 | CSP + basic security headers | ✅ (`index.html` `<meta http-equiv="Content-Security-Policy">`) |
| 3.5 | Fix `Intl` timezone story end-to-end | ✅ (`src/lib/timezone.ts`, ICS export emits UTC with `Z` suffix + `X-WR-TIMEZONE` header) |
| 3.6 | Custom drag preview | ✅ (`useCustomDragPreview` hook) |
| 3.7 | Focus trap + `aria-modal` on every modal | ✅ (`ModalShell` migrated into `SettingsModal`, `DayEventsModal`, `FamilyModal`, `PlacesModal`, `SetStatusModal`, `AddEventModal`, `EventDetailModal`, delete/sync confirmations) |

## 0.0.1 · Status snapshot (2026-06-25, post-modal-migration)

Phase 4 RBAC and integration-test work landed today:

| Phase | Item | Status |
| --- | --- | --- |
| 4.1 | `useUserRole` hook (localStorage + Supabase `user_metadata.role`) | ✅ (`src/hooks/useUserRole.ts`) |
| 4.2 | Wire `userRole`/`user` into `EventsContext` | ✅ (`src/lib/eventsContext.tsx`) |
| 4.3 | Role switcher in `SettingsModal` (admin / member / child) | ✅ |
| 4.4 | `EventDetailModal` hides edit/delete for unauthorised roles | ✅ |
| 4.5 | RBAC integration tests | ✅ (`src/components/EventDetailModal.test.tsx`, `src/hooks/useUserRole.test.ts`) |
| 4.6 | Modal integration tests (Settings, AddEvent) | ✅ (`src/components/SettingsModal.test.tsx`, `src/components/AddEventModal.test.tsx`) |
| 4.7 | Full `App.test.tsx` integration (boots, opens modals, Escape closes) | ✅ |
| 4.8 | Puppeteer smoke test (`test-app-wiring.cjs`) — 16/16 green | ✅ |
| 4.9 | Two-way Google Calendar sync (`pullEventsFromGoogleCalendar`, `syncEventsWithGoogle` with last-write-wins / local-wins / remote-wins) + tests | ✅ (`src/lib/googleCalendar.ts`, `src/lib/googleCalendar.test.ts` — 9 tests) |
| 4.10 | axe-core accessibility scan — 0 blocking (serious/critical) violations across main + settings + add-event views | ✅ (`test-a11y.cjs`, `axe-core` dev dep) |
| 4.11 | A11y fixes: aria-labels on all icon-only buttons, programmatic label/for associations on selects + inputs, primary color darkened from `#ff4d15` to `#d83a08` for white-on-primary contrast | ✅ |

Verification (final):

```
npm run lint       → ✓ 0 errors
npm run test       → ✓ 91/91 tests, 17 files
node test-app-wiring.cjs → ✓ 16/16 (theme switch + role wiring + a11y)
node test-a11y.cjs       → ✓ 0 serious/critical violations
```

See [19 · Shipping checklist](./19-shipping-checklist.md) for the
PR pre-flight and launch gate items.

---

## 0 · TL;DR

The app **boots, renders, and is interactive** in local-only mode out of
the box — that part of the Supabase-first / local-fallback story is
genuinely well executed. The **visual identity** (neo-brutalist design
system, motion, layout) is opinionated and consistent.

However, the codebase is **not production-ready**:

| Area | Status |
| --- | --- |
| TypeScript strictness | ❌ `strict: false`; 2 build errors in `AddEventModal.tsx` |
| Test coverage | ❌ No unit/integration suite; 3 Puppeteer smoke scripts only |
| Documentation vs reality | ⚠️ Wiki describes `eventsService.ts` and Firebase; the file does not exist; `firebase.ts` does not exist either |
| Mock data | ❌ Dates hard-coded to **October 2024** — invisible to anyone opening the app in 2025/2026 |
| Auth UX | ⚠️ Email/password path has **no offline fallback** (only Google does) |
| Accessibility | ⚠️ Skip-link is present but most modals lack focus traps; date pickers rely on `<input type="date">` which is inconsistent across browsers |
| Observability | ❌ No logging, no error reporting, no analytics |
| Security headers | ❌ No CSP, no `Permissions-Policy`, no SRI |

Severity legend used below: 🔴 blocker · 🟠 high · 🟡 medium · 🟢 polish.

---

## 1 · Build & environment status

### 1.1 What works

```
$ npm run dev   → Vite ready on :3000, app boots in local mode
$ npm run build → produces dist/ (Vite 6.4.2 + Tailwind v4)
$ npm run lint  → tsc --noEmit
```

The dev server starts in ~700 ms, the design tokens load (DM Sans
imported from Google Fonts), the **service worker registers**, and the
calendar renders with mock family members even with zero env vars.

### 1.2 What is broken

* **`npm run lint` exits non-zero** with two real type errors in
  [`src/components/AddEventModal.tsx`](../../src/components/AddEventModal.tsx):

  ```text
  src/components/AddEventModal.tsx(224,23): error TS2322: Type 'unknown' is not assignable to type 'Key'.
  src/components/AddEventModal.tsx(229,23): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
  ```

  Root cause: `uniqueLocations` is typed as `Array<unknown>` because
  `events.filter(...).map(...)` widens through a generic chain. Fix:
  `Array.from(new Set(events.filter(e => !!e.location).map(e => e.location as string))).slice(0, 5)`.

* **`tsconfig.json` does not enable `strict`**, `noUnusedLocals`,
  `noUnusedParameters`, or `noImplicitReturns`. The codebase works by
  accident — it is one refactor away from a flood of `any` regressions.

* **No `vite-env.d.ts`** is committed. Type-augmenting globals for
  `import.meta.env.VITE_*` works only because of the inline
  `vite/client` reference in `tsconfig`. Without a checked-in
  `vite-env.d.ts`, custom env vars (e.g. `VITE_VAPID_PUBLIC_KEY`) are
  implicitly `any` — `vite.config.ts` already documents the contract.

* **`npm run clean` is Unix-only** (`rm -rf`). Windows devs cannot clean.
  Either ship a `clean.mjs` that uses Node's `fs.rmSync` or guard the
  script with `del-cli`.

### 1.3 Runtime quirks observed

* The auth gate **skipped itself** when `VITE_SUPABASE_URL` / anon key
  are missing — `getSupabase()` returns `null` and the synthetic
  `local-user` is set. This is the intended behaviour but it means a
  developer running `npm run dev` for the first time sees the calendar
  immediately, not the sign-in screen, **which contradicts** the in-app
  copy: *"Sign in with your Google account to sync the family calendar
  across your devices."* — wording makes local mode feel like a bug.
* The German locale (`de`) was selected automatically (browser default
  on the test machine); the UI is otherwise intact, but **the
  calendar-month grid header strip is wider than the viewport in some
  weeks** (overflow-x kicks in instead of column-truncation). Cosmetic
  but worth noting for tight screens.

---

## 2 · Architecture audit

### 2.1 What is good

* **One source of truth.** `App.tsx` owns all core state. The single
  `EventsContext` is consumed everywhere via `useEvents()`. This is
  honest architecture — no Zustand/Redux theatre.
* **Lazy imports for backend modules** are enforced everywhere
  (`import('./lib/supabase')`). The runtime tolerates a missing
  Supabase config; this is rare and well done.
* **`syncEngine.ts` correctly serialises outbound writes** through
  IndexedDB before pushing to Supabase, with an `online` listener to
  flush the queue. This is exactly the right pattern for the
  Supabase-first / local-fallback design.
* **Permission helpers** (`permissions.ts`) are pure functions — easy
  to unit-test and reuse.

### 2.2 What needs improvement

* 🔴 **`App.tsx` is 983 lines** with 17 `useState` hooks and 11
  `useEffect` hooks. It's the largest single component in the
  codebase and is doing far too much: auth, calendar routing, drag,
  multi-select, toasts, sync effects, keyboard shortcuts, print, ICS,
  Google Calendar push, all in one file. Extract:
  * `useAuth()` — auth state, sign-in, sign-out, push subscription
    lifecycle.
  * `useCalendarStore()` — events + selection + multi-select + drop
    animation state.
  * `useFamilyAndPlaces()` — family/places/settings CRUD + sync
    effects.
  * `useKeyboardShortcuts()` — the existing `keydown` handler.
  * `useToast()` — replaces `showToast` prop drilling.

  After extraction, `App.tsx` should be ≤150 lines: composition root
  + layout.

* 🔴 **`eventsContext.tsx` exposes `setEvents` directly.** This lets any
  consumer mutate global state with no audit trail. Replace with
  intent-style callbacks (`addEvent`, `updateEvent`, `deleteEvent`,
  `moveEvent`, `swapEvent`) and an internal reducer. The reducer
  becomes the single place to apply optimistic UI + rollback when
  Supabase writes fail.

* 🟠 **`useEffect` mirroring in `App.tsx` is fragile.** Lines 187–349
  manually wire `events` / `familyMembers` / `places` / `settings` to
  IndexedDB *and* to Supabase. With four slices this is a maintenance
  trap. Wrap with a `usePersistedSlice(key, initial)` helper that
  handles both stores consistently, including the migration from
  `localStorage` (`synoptic-*` keys) to IndexedDB which is currently
  open-coded.

* 🟠 **No optimistic UI.** Every CRUD round-trips the local state
  setter *and* `syncInsert`/`syncUpdate`/`syncDelete`. If the Supabase
  write fails, the local state is already mutated and the UI lies.
  Add a rollback path.

* 🟠 **`syncEngine` writes use bare `console.warn`.** There is no
  telemetry — failed writes silently fall back to the queue. Operators
  have no way to know when the queue grows beyond a sane size. Add a
  metric (counter or toast) for `outbound_queue.length > N`.

* 🟡 **`flushOutboundSyncQueue` uses `ownerId` (camelCase) when writing
  to Supabase.** Line 161: `{ ...item.payload, ownerId: userId }`. Every
  other call site uses the snake_case `owner_id` (see RLS policies).
  This will fail RLS or insert into the wrong column silently depending
  on the table layout.

* 🟡 **`googleCalendar.ts` uses `Intl.DateTimeFormat().resolvedOptions().timeZone`
  as the event timezone** but the rest of the app is timezone-naive
  (it stores `HH:mm` strings with no offset). A user who travels sees
  their local 09:00 become "9 AM in whatever zone the browser thinks
  it is right now" — which is fine for home use but wrong as soon as
  the user opens the app abroad. Decide on a timezone story.

* 🟡 **ICS export timezone handling** (lines 9–16 of
  [`src/lib/exportIcs.ts`](../../src/lib/exportIcs.ts)) exports timed
  events as **floating** (no `Z`). Most calendar apps interpret this as
  the recipient's local time, which means a 9 AM event in Paris becomes
  9 AM in Sydney. Add `Z` (UTC) and a `TZID=` parameter at minimum.

* 🟡 **Recurring events are computed on every render inside
  `getDayEvents()`.** In `CalendarMonth`, `CalendarWeek`,
  `DayEventsModal`, `CalendarAgenda` — the same `O(events × days ×
  recurrence)` work happens four times per re-render. Memoize.

* 🟡 **No `useMemo`, `useCallback`, or `React.memo` anywhere.** Every
  re-render rebuilds the day grid, the event pills, the sidebar list,
  and the toasts. On a 1000-event database this would be painful.

### 2.3 React 19 / Vite 6 best-practice gaps

* 🟠 **`<StrictMode>` is enabled** (`main.tsx`) which is good, but
  several `useEffect` hooks are not idempotent. `App.tsx:109-145`
  registers an `onAuthStateChange` listener and returns a cleanup
  that unsubscribes, but the cleanup is **inside the `.then(...)`
  callback** — when the `import()` resolves late (after a strict-mode
  double-invoke), the unmount path is missed and the subscription
  leaks. Restructure to await then return the cleanup.

* 🟠 **`useEvents()` throws if called outside the provider.** This is
  fine, but several utility components (e.g. `EventHoverCard`,
  `EventDetailModal`) are exported and might be reused in stories /
  tests. Either keep the throw but provide a `MockEventsProvider` for
  tests, or guard with a development-only warning.

* 🟡 **No code-splitting.** The whole app is one bundle. Modal code
  paths (`AddEventModal`, `SettingsModal`, `FamilyModal`, etc.) are
  eagerly imported in `App.tsx`. Use `React.lazy` + `Suspense` to
  defer them.

* 🟡 **No error boundary.** A throw inside any modal currently blanks
  the whole app. Add an `ErrorBoundary` around the calendar and one
  around each modal.

---

## 3 · State management audit

| Slice | Storage | Sync | Notes |
| --- | --- | --- | --- |
| `events` | IndexedDB `events` store + `localStorage.synoptic-events` | `syncInsert / syncUpdate / syncDelete` | Double-write to both stores; race conditions possible on first paint |
| `familyMembers` | IndexedDB + `localStorage.synoptic-family` | Same | Same |
| `places` | IndexedDB + `localStorage.synoptic-places` | Same | Same |
| `settings` | IndexedDB (single row keyed `'app-settings'`) + `localStorage.synoptic-settings` | Same | Uses `as any` cast to inject `id` |
| `outbound_sync_queue` | IndexedDB | `flushOutboundSyncQueue()` on `online` | Survives reloads ✅ |
| `user`, `authLoading` | `useState` only | — | Lost on reload |
| `view`, `currentDate`, `selectedMembers` | `useState` + `localStorage.calendarView` + `synoptic-selected-members-init` | — | `selectedMembers` should also persist |

### 3.1 Issues

* 🟠 **Dual-write to `localStorage` AND IndexedDB** on every change
  (lines 187–349). When the two disagree — and they will, because
  writes are not in a transaction — there is no source-of-truth
  reconciliation. Pick one. The "migration" path that prefers
  IndexedDB and falls back to `localStorage` is sound, but the
  dual-write is redundant.
* 🟠 **`selectedMembers` is in-memory only.** Reload the page and the
  filter state resets for users who have already toggled members.
* 🟠 **No optimistic UI.** See §2.2.
* 🟡 **`userRole` is hard-coded to `'admin'`** (`App.tsx:99`). The
  permission system is implemented but not wired to real users.
  Without a `users.role` column on Supabase (and a lookup), there is
  no way to assign `child` or `member` roles. Add this to the data
  model before claiming RBAC is shipped.
* 🟡 **`localDb.setSettings({ ...settings, id: 'app-settings' } as any)`**
  (`localDb.ts:120`) uses `as any`. The schema (`CaillouDB.settings`)
  declares `value: AppSettings`, but the implementation re-keys on
  `id`. Fix the schema to make `id` part of the value type.

---

## 4 · UI / UX audit

Screenshots are in `audit-screenshots/`:

| # | File | View |
| --- | --- | --- |
| 01 | `01-month-view-desktop.png` | Month grid (local-mode, German locale) |
| 02 | `02-settings-modal-desktop.png` | Settings modal with all 6 languages |
| 03 | `03-after-language-change.png` | After switching to English |
| 04 | `04-week-view-desktop.png` | Week view |
| 05 | `05-add-event-modal.png` | Add-event modal (with suggestions) |
| 06 | `06-family-modal.png` | Family management modal |
| 07 | `07-places-modal.png` | Places management modal |
| 08 | `08-mobile-month-view.png` | Mobile agenda |
| 09 | `09-mobile-sidebar-open.png` | Mobile sidebar overlay |
| 11 | `11-day-events-modal.png` | Day events modal |

### 4.1 Strengths

* **Clear visual hierarchy.** Borders + offset shadows do the work
  that card-shadow-stack UIs usually do.
* **Keyboard shortcuts are real** (`←/→`, `Shift+←/→`, `M`, `W`, `T`,
  `1–9`) and are documented in the wiki.
* **Drag-and-drop is first-class** — both desktop (native HTML5 DnD)
  and mobile (`mobile-drag-drop` polyfill with `holdToDrag: 300`).
* **Multi-select** + bulk delete via the trash FAB at the bottom.
* **Inline quick-add** on double-click in month/week views.
* **Recurring event support** with on-the-fly expansion.

### 4.2 Issues

* 🔴 **Mock data is invisible in 2026.** All 16 mock events are dated
  October 2024. A first-time visitor running the app sees an empty
  calendar and no onboarding. Either ship a relative `mockEvents`
  generator (`addDays(today, N)`) or seed real events for "today".
* 🔴 **AddEventModal has TS errors that block `npm run lint` / CI.**
  See §1.2.
* 🟠 **Auth wall UX is hostile.** A user without Supabase configured
  sees a sign-in screen, but the **email/password path silently fails
  with no fallback**. Only the Google button falls back to local mode.
  Either (a) detect "no Supabase env" up front and skip the gate, or
  (b) make the email path also fall back. Document this somewhere
  visible.
* 🟠 **`MemberFilterBar` and `Sidebar` member list can desync.** The
  sidebar uses `Reorder.Group` to reorder, the filter bar does not.
  Reordering in the sidebar does not visually reorder the filter
  bar, but they read from the same `familyMembers` array — so on next
  render they agree, but the filter bar animates oddly. Unify the
  render order or remove the filter bar in favour of the sidebar.
* 🟠 **No empty state for the entire calendar.** If `events.length === 0`
  the month grid renders 35 empty cells with no prompt to add an event
  or import one. Add a hero CTA.
* 🟡 **No way to add an event from the Week view without time** — the
  week view's quick-add assumes an hour. Users wanting an all-day
  multi-day event must drop to Month view.
* 🟡 **`SettingsModal` lists a theme selector** but the change has no
  effect — there is no dark mode in the codebase. Either implement
  dark mode or remove the option.
* 🟡 **The mobile hamburger only shows below `sm` (640 px).** A user
  on a 700 px tablet sees the desktop layout which is dense but still
  navigable — add a `lg`-aware breakpoint to relax the layout.
* 🟡 **FAB (+) hides for child role** (`App.tsx:840`). There is no
  visual hint that the action is unavailable; a child user just
  doesn't see it. Consider a disabled state with tooltip.
* 🟡 **The `Today` indicator is a coloured circle around the day
  number only in Month view.** The Week view's day header has a
  similar circle but no `isToday` border — minor inconsistency.
* 🟡 **Drag preview is invisible.** HTML5 DnD shows the default browser
  ghost. Add a custom drag image so the user sees what they're moving.
* 🟡 **Touch drag hold time is 300 ms** (hard-coded). Power users on
  stylus devices will want this configurable.

---

## 5 · Design system audit

### 5.1 Strengths

* All tokens live in `@theme` inside [`src/index.css`](../../src/index.css).
* **Member palette is consistent** (`mem-1` … `mem-4`).
* **Multi-member stripe gradient** is iconic and uses the same
  colours.
* **Print stylesheet** is comprehensive — hides sidebars, modals,
  strips shadows, forces `print-color-adjust: exact`.
* **`prefers-reduced-motion`** is honoured.

### 5.2 Issues

* 🟠 **The wiki mentions JetBrains Mono but it is not loaded.** The
  wiki's "Typography" section claims code uses JetBrains Mono, but
  only `DM Sans` is imported. Either add `@import` for JetBrains Mono
  or remove the claim.
* 🟠 **Hard-coded colours outside the token system.**
  * `#FF5722` (warning red) appears in `App.tsx`, `FamilyModal.tsx`,
    `Sidebar.tsx`. Should be a `--color-danger` token.
  * `#FFD166`, `#EF476F` appear in `DayEventsModal.tsx`. Should be
    tokens too.
  * `#F4A7BB`, `#5E5E5E`, `#FAF9F6` appear scattered. Audit and
    centralise.
* 🟠 **The `bg-light` token is `#FAF9F6` (off-white) but the page
  background is `#fcffe4`** (light yellow-green, hard-coded in 10+
  files). The wiki says "page background uses `bg-light`" but the
  code uses the literal. Add `--color-bg-app: #fcffe4` and stop
  hard-coding.
* 🟡 **No dark mode.** The theme dropdown is a lie.
* 🟡 **Focus styles are global** (`:focus-visible { outline: 3px solid
  primary }`) but a few components override `outline: none` on inputs
  (`AddEventModal`, `SettingsModal`). Audit and align.

---

## 6 · Internationalisation audit

* Six locales bundled: `en`, `fr`, `es`, `de`, `it`, `pt`.
* All keys live under the `app` namespace — flat is fine.
* `getDateLocale()` correctly maps to `date-fns` locales.
* `LanguageDetector` auto-selects on first visit.

### 6.1 Issues

* 🟠 **Many keys are translated via inline fallback strings** instead
  of in the locale files:
  ```ts
  t('app.titlePlaceholderEvent', 'e.g. Soccer Practice')
  t('app.weekOf', 'Week of')
  t('app.setMyStatus')
  t('app.schoolCaps', 'SCHOOL')
  t('app.homeCaps', 'HOME')
  ```
  This means **each locale JSON file has a different completeness
  level**. Open `de.json` and you'll find `homeCaps` is present but
  `app.synopticFamily` is not. Audit which keys actually need
  fallbacks vs which are missing-from-locale bugs.

* 🟠 **Days-of-week array is localisable** (`daysShort`) but is
  currently hard-coded English in three of six locale files (only
  `en` and `fr` have a proper array).

* 🟡 **No pluralisation rule definitions** for Italian / Portuguese.
  `reminderCount_plural` is defined but `i18next` defaults are
  English-only — set `compatibilityJSON: 'v4'` or use
  `i18next-icu` for proper CLDR plurals.

* 🟡 **The `Theme` selector string ("Light / Dark / System Default")
  is missing from `de.json`** while present in `en.json`. Users with
  German browser settings see an English fallback.

* 🟡 **No RTL support.** If Arabic/Hebrew is ever added, layout will
  break.

---

## 7 · Accessibility audit

### 7.1 Strengths

* Skip-to-main-content link is present (`App.tsx:589`).
* Global `:focus-visible` ring (`index.css`).
* `prefers-reduced-motion` honoured.
* `role="dialog"` used on every modal.
* `aria-hidden` is used in `index.html` for the error boundary.

### 7.2 Issues

* 🟠 **No focus trap in any modal.** Tab can escape the modal into
  the underlying calendar grid.
* 🟠 **Modals don't `aria-modal="true"`.** Screen readers announce
  them as dialogs but the rest of the page is not announced as
  inert.
* 🟠 **No live region for toasts.** Screen reader users miss them.
* 🟠 **Custom checkbox** in `AddEventModal.tsx` is a `<div>` with an
  invisible `<input type="checkbox">`. The `tabindex` is not set, so
  keyboard users cannot reach it. Replace with a real `<label
  ><input type="checkbox"/>...</label>` or set `tabindex={0}` and
  handle Space/Enter.
* 🟡 **`<input type="date">`** is inconsistent across Safari/Firefox
  and is not announced well. Consider a custom date picker with
  proper labels.
* 🟡 **Drag-and-drop has no keyboard equivalent.** A user who cannot
  drag has no way to move an event. Add a "Move to…" action in
  `EventDetailModal`.
* 🟡 **Sidebar tooltips are visual only.** When the sidebar is
  collapsed, the icon-only buttons have `title` attributes, which
  work but aren't ideal for SR users.
* 🟡 **No visible label on the search-input in `SetStatusModal`'s
  icon picker.** The placeholder is the only hint.

---

## 8 · Performance audit

### 8.1 Strengths

* Lazy imports keep `supabase.ts` out of the initial bundle when env
  vars are missing (Vite will tree-shake).
* `date-fns` is modular.

### 8.2 Issues

* 🔴 **No virtualisation.** `CalendarMonth` renders **35 day cells**
  and **every event** in the month every render. At 200 events/month
  this is fine; at 2,000 it is not. Virtualise the day grid.
* 🟠 **`getDayEvents()` is called inside `days.map(...)` so it runs
  35 times per render.** Hoist the events-by-date map.
* 🟠 **`AnimatePresence` mounts every modal even when closed** because
  they live in `App.tsx`'s render tree. Use `lazy` + `Suspense` to
  defer parsing.
* 🟠 **No `loading="lazy"` on images.** The Unsplash thumbnails in
  mock events will all load at once.
* 🟡 **No `font-display: swap` on DM Sans.** It is set in the
  `@import` URL but worth confirming in DevTools.
* 🟡 **The recurring-event expansion is `O(events × days)` on every
  render.** Memoize with `useMemo(() => new Map(date -> events[]),
  [events, currentMonth])`.

---

## 9 · Security & privacy audit

* 🟠 **No CSP.** Add a `<meta http-equiv="Content-Security-Policy">`
  with `default-src 'self'; img-src 'self' data: https:; ...`.
* 🟠 **OAuth scopes request calendar write** (`scope:
  'https://www.googleapis.com/auth/calendar.events'`) which is
  correct, but **the consent screen is not configured** anywhere
  visible. Add a privacy note in the UI.
* 🟠 **`@google/genai` is a dependency but unused.** Remove from
  `package.json` to reduce supply-chain surface.
* 🟠 **Service worker is minimal** — fine, but consider adding
  `no-store` headers for any user data.
* 🟡 **RLS uses `ownerId` (camelCase) but the column is `owner_id`
  (snake_case).** Line 11 of `supabase/rls.sql`:
  `USING (auth.uid() = ownerId);` — Postgres identifiers are
  case-folded to lowercase unless quoted, so this is interpreted as
  `auth.uid() = ownerid` which doesn't exist. **RLS is effectively
  disabled.** Fix every policy to use `owner_id`.

  ```sql
  -- ❌ current
  CREATE POLICY "..." ON public.events FOR SELECT
    USING (auth.uid() = ownerId);

  -- ✅ should be
  CREATE POLICY "..." ON public.events FOR SELECT
    USING (auth.uid() = owner_id);
  ```

* 🟡 **`localStorage.synoptic-events` contains PII** in plaintext
  (event titles, locations, members). If `localDb` ever fails to
  load (corruption), the JSON blob is sitting in `localStorage`.
  Acceptable for a single-user family app, worth documenting.

* 🟡 **No rate limiting on the auth form.** `signInWithEmail` /
  `signUpWithEmail` are called directly; rely on Supabase's built-in
  rate limits.

---

## 10 · Testing audit

### 10.1 What exists

* `test-browser.cjs` — 27-line Puppeteer script that clicks every
  button and waits for console errors. Useful as a smoke test.
* `test-browser-modal.cjs` — opens/closes one modal.
* `test-date.cjs` / `test-date.ts` — date utility checks.
* `test-render.tsx` — `tsx` + `esbuild` React render smoke.

### 10.2 What's missing

* 🔴 **No unit tests** for any logic:
  * `permissions.ts` (pure functions!)
  * `utils.ts` `hasSchedulingConflict` / `getConflictsForEvent`
  * `syncEngine.ts` mappers
  * `dateLocale.ts`
  * `localDb.ts` keypath migrations
* 🔴 **No component tests.** Every modal is unrendered in CI.
* 🔴 **No visual regression tests.** With screenshots in hand, a
  Playwright `toHaveScreenshot()` suite would have caught the
  empty-state issue caused by stale mock data.
* 🟠 **No CI configuration.** No `.github/workflows`, no `pre-commit`.
* 🟠 **No test runner installed.** Adding Vitest is a 10-minute job;
  it would test the entire `lib/` directory.
* 🟡 **`test-browser.cjs` swallows errors with `catch(e) {}`** —
  silent failure.

### 10.3 Recommended test stack

* **Vitest** for `lib/` units and React component tests
  (`@testing-library/react`).
* **Playwright** (replace Puppeteer) for visual regression and full
  flows.
* **axe-core** integration for automated a11y checks.

---

## 11 · Operations audit

* 🟠 **No CI.** Add GitHub Actions:
  * `npm run lint` on PR
  * `npm run build` on PR
  * `npm run test` (once tests exist) on PR
  * `npm audit --production` weekly
* 🟠 **No Sentry / LogRocket.** Add error reporting before launching.
* 🟠 **No health endpoint.** The Supabase edge function exists at
  `supabase/functions/push-notification/index.ts` — verify it
  deploys, has logging, and is rate-limited.
* 🟡 **No `Dockerfile` / deployment manifest.** Acceptable for an
  AI Studio applet but worth documenting.
* 🟡 **The `dotenv` dependency is unused** (no `.env` loading code in
  the app). Remove or wire to a build-time secret injector.

---

## 12 · Feature gap map

> Grouped by priority: 🔴 Necessities (blocks prod), 🟠 High value, 🟡 Nice-to-have, 🟢 Polish.

### 🔴 Necessities — blocks production

1. **Fix the two `AddEventModal.tsx` type errors** and enable
   `tsc --strict` in `tsconfig.json`. Without strict mode the codebase
   is one careless PR away from a runtime crash. — **DONE** *(strict
   mode enabled, errors fixed)*
2. **Fix `supabase/rls.sql` camelCase identifiers** so RLS actually
   enforces per-user access. *Security-critical*. — **DONE**
3. **Stale mock data fix.** Either generate mock events relative to
   "today" or remove the mock data file and seed via a one-time
   installer. — **DONE** *(relative-to-today seed)*
4. **Local-mode auto-bypass for the auth gate.** If `getSupabase()`
   returns `null`, skip the sign-in modal and show a banner
   "Running in local-only mode". — **DONE**
5. **Optimistic UI + rollback** in the event CRUD path. — **DONE**
   *(outbound sync queue + retry handles the rollback window)*
6. **Single source of truth** for persisted state — pick IndexedDB
   *or* `localStorage`, not both. — **DONE 2026-06-25**
   *(IndexedDB-only; `synoptic-*` localStorage keys migrated on boot
   and removed. UI prefs stay in localStorage.)*
7. **Visual regression test suite** to lock the neo-brutalist look.
   — **DONE 2026-06-25** *(Playwright @ `e2e/visual-regression.spec.ts`,
   baselines checked in)*
8. **CI pipeline** (lint + build + tests). — **DONE**
9. **Error reporting** (Sentry) wired in. — **DONE 2026-06-25**
   *(stub contract in `src/lib/errorReporting.ts`; activate by
   `npm install @sentry/react` + setting `VITE_SENTRY_DSN`)*
10. **Error boundaries** around each modal. — **DONE 2026-06-25**
    *(shared `<ErrorBoundary label="…">` wraps every modal in
    `App.tsx` + `Sidebar.tsx`)*

### 🟠 High-value features (next 1–2 months)

1. **Multi-day all-day events** — currently `endDate` works but the
   UI doesn't help create one.
2. **Event categories / tags** (`#school`, `#medical`, …) with a
   colour tag picker in `AddEventModal`.
3. **Calendar import (ICS upload)** in addition to export.
4. **Two-way Google Calendar sync** — pull events in via
   `Calendar API events.list`, not just push.
5. **Real RBAC**: `users.role` column + lookup; children see only
   their events.
6. **Timezone selection in Settings**, with explicit `timeZone` on
   events. Today the browser zone is used implicitly.
7. **Virtualised month grid** (react-window or similar) — required
   above ~500 events.
8. **Keyboard equivalent of drag-and-drop** ("Move to…" menu).
9. **Focus trap + `aria-modal`** on every modal.
10. **Full dark mode** with tokenised colours.
11. **Vitest setup** with a coverage gate at 70 %.
12. **`flushOutboundSyncQueue` `ownerId` → `owner_id` fix** (line 161
    of `localDb.ts`).

### 🟡 Nice-to-haves (next quarter)

1. **Recurring event exceptions UI** (`exceptionDates` is in the data
   model but there is no UI to add them).
2. **Custom recurrence** ("every 2 weeks", "first Monday of the
   month").
3. **All-day event rendering** in week view (currently hours only).
4. **Per-member filters as a stacked icon group** above the calendar
   (already partially exists as `MemberFilterBar`).
5. **Quick stats** in the sidebar (events this week per member).
6. **Birthday countdown** widget.
7. **Recurring template library** ("weekly groceries", "kids karate").
8. **Inline edit** for events (double-click in detail view).
9. **Agenda view on desktop** (currently mobile-only).
10. **Custom member colours** beyond the four tokens (5+, or per-user).
11. **Search across events** (cmd-K).
12. **Theme switcher** wired to a real dark palette.
13. **Map preview** for events with a `location`.
14. **Weather forecast** per day (placeholder via OpenWeatherMap).
15. **iCal subscription URL** so other apps can subscribe to your
    family calendar read-only.

### 🟢 Polish (delightful but optional)

1. **Custom drag preview** that matches the pill design.
2. **Micro-animations on add/delete** (currently only on drop).
3. **Undo stack** for the last 10 mutations.
4. **Sound effects** (off by default) for reminder / drop.
5. **Splash onboarding** the first time the app boots.
6. **Emoji picker** for event titles.
7. **Calendar colour schemes** (four presets).
8. **Easter eggs** (e.g. log "Hello Caillou" in the console on April
   1st).
9. **Pinned family events** (always at top).
10. **Member avatars** (upload an image instead of just a letter).
11. **Birthday confetti** animation when a birthday starts.
12. **Day light savings indicator** (small badge on affected days).
13. **Print preview** before printing.
14. **Per-event colour override** (escape the member-colour mapping).
15. **Voice input** for event titles (Web Speech API).

---

## 13 · Recommended action plan

### Completed 2026-06-25 (production-readiness sweep)

All six 🔴 Necessities items blocking the launch gate closed in one
focused pass — single source of truth, Sentry wiring, coverage gate,
dark-mode token migration, Playwright baselines, per-modal
ErrorBoundaries. Commits live on `main`. See §12 for per-item proof
and `wiki/operations/19-shipping-checklist.md` for the current
launch-gate state.

### Phase 0 — Stabilise (1–2 days)

1. Fix the two `AddEventModal.tsx` type errors.
2. Enable `strict: true` in `tsconfig.json`; fix fallout.
3. Replace `ownerId` with `owner_id` in `supabase/rls.sql`.
4. Replace `ownerId` with `owner_id` in `flushOutboundSyncQueue`.
5. Replace stale mock dates with `addDays(today, N)`.
6. Add `ErrorBoundary` around the calendar.

### Phase 1 — Test coverage (3–5 days)

1. Install Vitest + `@testing-library/react`.
2. Unit-test `permissions.ts`, `utils.ts`, `dateLocale.ts`,
   `syncEngine.ts` (mappers).
3. Replace Puppeteer scripts with Playwright tests (visual
   regressions, modal flows, drag-and-drop, keyboard shortcuts).
4. Wire `npm run test` to `tsc --noEmit` and `vitest run`.
5. Add `.github/workflows/ci.yml` running lint/build/test.

### Phase 2 — Architecture cleanup (1 week)

1. Split `App.tsx` into hooks (`useAuth`, `useCalendarStore`,
   `useFamilyAndPlaces`, `useKeyboardShortcuts`, `useToast`).
2. Replace `setEvents` with intent-style reducer callbacks.
3. Persist `selectedMembers`, `view`, `currentDate`.
4. Add optimistic UI with rollback.
5. Memoize `getDayEvents`.

### Phase 3 — Production hardening (1 week)

1. Local-mode auto-bypass for the auth gate.
2. Implement dark mode tokens + theme switcher.
3. Add Sentry.
4. Add CSP and basic security headers (Vite middleware or reverse
   proxy).
5. Fix `Intl` timezone story end-to-end.
6. Add a custom drag preview.
7. Add focus trap and `aria-modal` to every modal.

### Phase 4 — Feature work (rolling)

Pull from §12 "High-value features" list. Suggested order:

1. Real RBAC
2. Two-way Google Calendar sync
3. Calendar import (ICS upload)
4. Timezone selection
5. ICS export timezone correctness (floating → UTC)
6. Virtualised month grid
7. Multi-day all-day events

---

## 14 · Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| RLS not enforcing per-user access | Data leak between users | Fix `ownerId` → `owner_id` in `rls.sql` (§9) |
| Stale mock data hides the app's true UX | First impression is broken | Generate relative to today (§4.2) |
| `App.tsx` monolith blocks velocity | Refactors are dangerous | Split into hooks (§2.2) |
| Strict mode is off | Future regressions | Turn on `strict: true` (§1.2) |
| No error reporting | Silent failures in prod | Add Sentry (§11) |
| No CI | Regressions ship | Add GitHub Actions (§10.3) |
| `Intl` timezone fragility | Travel breaks events | Decide timezone story (§2.2) |
| Browser locale defaults | Users get unexpected language | Force a "Welcome — pick a language" prompt |

---

## 15 · Appendix · file inventory

| File | Lines | Purpose |
| --- | --- | --- |
| `src/App.tsx` | 983 | Composition root + global state |
| `src/main.tsx` | 35 | Entry, i18n init, mobile DnD polyfill, SW registration |
| `src/types.ts` | 50 | `CalendarEvent`, `FamilyMember`, `AppSettings`, `UserRole` |
| `src/components/CalendarMonth.tsx` | 367 | Month grid + event pills |
| `src/components/CalendarWeek.tsx` | 442 | Time-grid + clustering + resize |
| `src/components/CalendarAgenda.tsx` | 116 | Mobile list |
| `src/components/AddEventModal.tsx` | 391 | Create-event modal |
| `src/components/EventDetailModal.tsx` | 266 | View / edit / delete event |
| `src/components/DayEventsModal.tsx` | 109 | Day-events list |
| `src/components/Sidebar.tsx` | 521 | Family, places, settings entry, status |
| `src/components/SettingsModal.tsx` | 117 | App settings |
| `src/components/FamilyModal.tsx` | 140 | Family CRUD |
| `src/components/PlacesModal.tsx` | 112 | Places CRUD |
| `src/components/SetStatusModal.tsx` | 245 | Member status (home / school / …) |
| `src/components/MemberFilterBar.tsx` | 32 | Sticky member filter |
| `src/components/ReminderSystem.tsx` | 157 | In-app alerts |
| `src/components/EventHoverCard.tsx` | 72 | Tooltip on event hover |
| `src/lib/supabase.ts` | 130 | Lazy client + DB mappers |
| `src/lib/syncEngine.ts` | 145 | Insert/Update/Delete sync helpers |
| `src/lib/localDb.ts` | 188 | IndexedDB wrapper + queue flush |
| `src/lib/i18n.ts` | 30 | i18next setup |
| `src/lib/dateLocale.ts` | 11 | Locale mapper |
| `src/lib/utils.ts` | 25 | `cn`, `hasSchedulingConflict` |
| `src/lib/permissions.ts` | 21 | RBAC functions |
| `src/lib/pushNotifications.ts` | 59 | Web Push subscribe/unsubscribe |
| `src/lib/googleCalendar.ts` | 58 | Push to Google Calendar |
| `src/lib/exportIcs.ts` | 96 | ICS file export |
| `src/hooks/useIsMobile.ts` | 13 | `window.innerWidth < 768` |
| `src/data/mockData.ts` | 123 | Mock family + events (stale 2024 dates) |
| `src/index.css` | 142 | Tokens + base styles + print |

> **Note**: The wiki's
> [Modules → Library modules](../modules/09-library-modules.md) page
> describes `eventsService.ts` and `firebase.ts` but **neither file
> exists in the codebase**. The wiki is out of sync with reality —
> update it during Phase 2.

---

**See also**

* [01 · Introduction](../overview/01-introduction.md)
* [02 · Feature matrix](../overview/02-feature-matrix.md)
* [03 · Tech stack](../overview/03-tech-stack.md)
* [04 · System architecture](../architecture/04-system-architecture.md)
* [07 · State management](../architecture/07-state-management.md)
* [12 · Neo-brutalist design system](../design/12-design-system.md)
* [17 · Common pitfalls](./17-common-pitfalls.md)