# AGENTS.md — Caillou Family Calendar

## Project Overview

A **React 19 + TypeScript + Vite** family calendar applet ("Caillou") designed for Google AI Studio. It supports month/week views, drag-and-drop event management, family member tracking, Google Calendar sync, push notifications, and i18n in 6 languages. The app is designed to run both with Supabase auth/sync **and** in a fully local/offline mode.

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type-check only (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` and `server.js` (Unix `rm` — breaks on Windows) |
| `node test-browser.cjs` | Puppeteer smoke test against `localhost:3000` |
| `node test-browser-modal.cjs` | Puppeteer modal interaction test |
| `node test-date.cjs` | Date utility test script |
| `npx tsx test-date.ts` | TypeScript date test via `tsx` |
| `npx tsx test-render.tsx` | Render test via `tsx` + `esbuild` |

> **No unit test framework** (Jest/Vitest) is configured. Testing is done via Puppeteer scripts and `tsx` one-offs.

## Architecture & Data Flow

### State Management
- **No Redux/Zustand** — state is managed via a single massive React Context (`EventsContext`) defined in `src/App.tsx` and typed in `src/lib/eventsContext.tsx`.
- `App.tsx` holds all core state: `events`, `familyMembers`, `places`, `settings`, `user`, `selectedMembers`, `isMultiSelectMode`, etc.
- Child components consume state via `useEvents()` hook. **Always** use this hook; never pass props down manually for calendar data.

### Backend Strategy: Supabase-first, Local fallback
- The app **lazily imports** `src/lib/supabase.ts` everywhere (inside `useEffect`, event handlers, callbacks). **Never** import it at the top level of a module.
- If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing or invalid, `getSupabase()` returns `null` and the app runs in **local-only mode** with a synthetic `local-user`.
- In local mode, all data persists to `localStorage` with keys:
  - `synoptic-events`
  - `synoptic-family`
  - `synoptic-places`
  - `synoptic-settings`
  - `synoptic-selected-members-init`
  - `calendarView`
- When a real Supabase user is present, the app also syncs to Supabase tables (`events`, `family_members`, `places`, `settings`) and sets up realtime subscriptions via `postgres_changes`.

### Firestore naming confusion
- `src/lib/eventsService.ts` functions are named `*Firestore` (e.g., `addEventToFirestore`), but they **use Supabase**, not Firebase/Firestore. Do not add actual Firestore logic here.
- `src/lib/firebase.ts` exists and initializes Firebase Auth, but the active auth path is Supabase OAuth with Google provider.

### Date handling
- Calendar events store dates as **ISO strings `YYYY-MM-DD`** in the `date` field, not `Date` objects.
- `startTime` / `endTime` are **strings `HH:mm`**.
- Use `date-fns` for all date math. `date-fns-tz` is installed but rarely used directly.
- `getDateLocale()` maps `i18n.language` to `date-fns` locale objects.
- Recurring events (daily/weekly/monthly/yearly) are computed on-the-fly in `getDayEvents()` inside `CalendarMonth`/`CalendarWeek` — there is no expansion to concrete instances.

## Code Organization

```
src/
  App.tsx              — Root component, all global state, EventsContext.Provider
  types.ts             — Core TypeScript types (CalendarEvent, FamilyMember, etc.)
  main.tsx             — Entry point, i18n init, mobile drag-drop polyfill, SW registration
  index.css            — Tailwind v4 theme, custom utilities, print styles
  data/mockData.ts     — Hardcoded mock events (dates from 2024!) and default family members
  components/          — All UI components (modals, calendar views, sidebar)
  lib/
    eventsContext.tsx  — Context type definition + useEvents() hook
    eventsService.ts   — Supabase CRUD wrappers (misnamed "Firestore")
    supabase.ts        — Lazy Supabase client singleton
    firebase.ts        — Firebase Auth init (mostly inactive)
    googleCalendar.ts  — Push events to Google Calendar via provider_token
    exportIcs.ts       — ICS file export
    i18n.ts            — i18next setup with 6 bundled locales
    dateLocale.ts      — date-fns locale mapper
    utils.ts           — cn() utility (clsx + tailwind-merge)
  locales/             — Translation JSONs: en, fr, es, de, it, pt
public/
  sw.js                — Minimal service worker for push notifications
```

## Design System (Neo-Brutalist)

The app uses a distinctive **neo-brutalist** visual style. Do not break these conventions:

- **Colors**: Defined in `src/index.css` `@theme`:
  - `primary: #ff4d15`
  - `bg-light: #FAF9F6`
  - `surface: #FFFFFF`
  - `ink: #1A1A1A`
  - Member colors: `mem-1` (#B39DDB), `mem-2` (#80CBC4), `mem-3` (#FFAB91), `mem-4` (#F48FB1)
- **Shadows**: `shadow-neo` = `4px 4px 0px #1A1A1A`; `shadow-neo-hover` = `6px 6px 0px #1A1A1A`
- **Borders**: Very thick — `border-[3px]`, `border-[4px]`, `border-thick` (4px). Buttons and cards always have visible borders.
- **Background**: App background is `#fcffe4` (light yellow-green), not white.
- **Typography**: DM Sans only. `font-display` and `font-body` both map to it.
- **Family member pills**: Single member events use the member's `bgClass` (e.g., `bg-mem-1`). Multi-member events get a **striped CSS gradient** (`repeating-linear-gradient` with all four member colors).
- **Print styles**: Extensive `@media print` rules in `index.css`. Hide interactive elements, remove shadows, flatten colors.

## Tailwind v4 Configuration

- Uses `@tailwindcss/vite` plugin, **not** a traditional `tailwind.config.js`.
- Theme tokens are defined via `@theme` in `src/index.css`.
- `cn()` from `src/lib/utils.ts` merges `clsx` + `tailwind-merge`.

## Key Conventions & Patterns

### Lazy imports are mandatory for backend modules
```typescript
// CORRECT
import('./lib/supabase').then(s => s.getSupabase()?.from('events')...)

// WRONG — will crash the app if env vars are missing
import { getSupabase } from './lib/supabase';
```

### Event IDs
- Generated with `Math.random().toString(36).substring(7)` — not UUIDs.

### Adding new translations
1. Add the key to `src/locales/en.json` under the `"app"` namespace.
2. Add corresponding keys to `fr.json`, `es.json`, `de.json`, `it.json`, `pt.json`.
3. Use `const { t } = useTranslation()` and call `t('app.keyName')`.

### Component patterns
- Modals are controlled by `isOpen`/`onClose` props and use `AnimatePresence` + `motion.div` from `motion/react` (Framer Motion's newer package).
- All interactive buttons have `hover:-translate-y-1 active:translate-y-1` and neo shadows.
- `role="dialog"` is used on modal containers; keyboard Escape handling checks for `[role="dialog"]` globally.

## Testing

- **No formal test suite**. Use the Puppeteer scripts in the root:
  - `test-browser.cjs` — launches browser, clicks all buttons, checks for console errors.
  - `test-browser-modal.cjs` — tests modal open/close flow.
  - `test-date.cjs` / `test-date.ts` — date utility checks.
  - `test-render.tsx` — React render smoke test.
- To run: start `npm run dev`, then in another terminal run `node test-browser.cjs`.

## Important Gotchas

1. **HMR disable switch**: `vite.config.ts` checks `process.env.DISABLE_HMR`. When `true`, file watching is disabled to prevent flickering during agent edits in AI Studio. **Do not modify this logic.**

2. **Mobile drag-and-drop**: `mobile-drag-drop` polyfill is initialized in `main.tsx` with `holdToDrag: 300`. A passive `touchmove` listener is added as a workaround. Touch drag-and-drop will break if this is removed.

3. **Service Worker**: `public/sw.js` is minimal — only handles `notificationclick`. It does **not** cache assets for offline use.

4. **Google Calendar sync**: Uses the Supabase session's `provider_token` (Google OAuth scope `https://www.googleapis.com/auth/calendar.events`). If the token is missing, sync fails with a toast error.

5. **Firebase config**: `firebase-applet-config.json` has empty strings. In AI Studio, this is auto-injected at runtime. Do not commit real credentials.

6. **Env vars for Supabase**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be prefixed with `VITE_` to be exposed to the client.

7. **Multi-day events**: `endDate` is **inclusive** in the UI. The Google Calendar sync converts it to exclusive by adding one day, which is Google's requirement.

8. **Birthdays**: Setting `isBirthday: true` automatically forces `recurrence.type === 'yearly'` in the UI. The recurrence dropdown is disabled when the birthday checkbox is checked.

9. **Quick-add**: Double-click a day cell to open an inline quick-add input. Single-click opens the day events modal.

10. **Event drag-and-drop**: Events can be dragged to different days (moves the event) or dropped on other events (swaps dates/times). Drag is disabled in multi-select mode.

11. **Keyboard shortcuts** (when no input/modal is focused):
    - `←` / `→` — navigate days
    - `Shift + ←` / `Shift + →` — navigate months/weeks
    - `↑` / `M` — month view
    - `↓` / `W` — week view
    - `T` — today
    - `1`–`9` — toggle family member filter

12. **Clean script uses `rm -rf`**: This will fail on Windows. Use `rmdir /s /q dist` equivalent if cleaning on Windows.

13. **Package name mismatch**: `package.json` has `"name": "react-example"` — this is not the real project name.
