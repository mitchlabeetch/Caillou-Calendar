# 03 · Tech stack

> Path: `wiki/overview/03-tech-stack.md` · Section: **Overview**

All listed dependencies are pinned in [`package.json`](../../package.json).
The project intentionally avoids Redux/Zustand in favour of a single
React Context — see
[Architecture → State management](../architecture/07-state-management.md).

## Runtime dependencies

| Layer | Library | Version | Purpose |
| --- | --- | --- | --- |
| UI | `react` | `^19.0.1` | Component model + concurrent rendering. |
| UI | `react-dom` | `^19.0.1` | DOM renderer. |
| Style | `tailwindcss` | `^4.1.14` | Utility CSS; tokens in `@theme`. |
| Style | `@tailwindcss/vite` | `^4.1.14` | Vite plugin (no `tailwind.config.js`). |
| Anim | `motion` | `^12.40` | Modal transitions, drag gestures, layout. |
| Date | `date-fns` | `^4.3` | All date math. |
| Date | `date-fns-tz` | `^4.3` | Time-zone helpers (rarely used directly). |
| i18n | `i18next` | `^26` | Translation runtime. |
| i18n | `react-i18next` | `^16` | React bindings. |
| i18n | `i18next-browser-languagedetector` | `^9` | Auto-detects browser locale. |
| Backend | `@supabase/supabase-js` | `^2.106` | Auth, REST, realtime. |
| Storage | `idb` | `^8.0.3` | IndexedDB wrapper for the local DB. |
| DnD | `mobile-drag-drop` | `^3.0.0-rc` | Touch / hold-to-drag polyfill. |
| NLP | `chrono-node` | `^2.9` | Parses natural-language dates in event titles. |
| Icons | `lucide-react` | `^0.546` | Icon library used everywhere. |
| Reorder | `framer-motion` | `^12.40` | `Reorder.Group` for the sidebar. |

## Dev dependencies

| Library | Version | Purpose |
| --- | --- | --- |
| `vite` | `^6.2.3` | Dev server + build. |
| `@vitejs/plugin-react` | `^4.3.4` | Fast Refresh + JSX transform. |
| `typescript` | `~5.8.2` | Type-check only (no separate emit). |
| `puppeteer` | `^25` | Browser smoke tests. |
| `tsx` | `^4.21` | Runs TypeScript one-offs without compiling. |
| `esbuild` | `^0.25` | Bundler for `tsx` render tests. |
| `firebase` | `^12` | Auth scaffolding (mostly inactive). |

## Build & runtime environment

| Tool | Required version |
| --- | --- |
| Node.js | `>= 18` |
| npm | `>= 9` |
| Browser | Modern Chromium / Firefox / Safari with IndexedDB, Web Push, Service Worker. |

## Notable omissions

* **No Redux, Zustand, Jotai or Recoil.** State lives in a single Context
  provider mounted in [`src/App.tsx`](../../src/App.tsx).
* **No Jest or Vitest.** Testing is done via Puppeteer scripts at the repo
  root (`test-browser.cjs`, `test-browser-modal.cjs`, `test-date.cjs`) and
  `tsx` one-offs (`test-date.ts`, `test-render.tsx`).
* **No `tailwind.config.js`.** Tailwind v4 reads its theme directly from
  the `@theme` block in [`src/index.css`](../../src/index.css).
* **No Firebase in the hot path.** Despite `firebase` being installed,
  `eventsService.ts` (mis-named "Firestore") actually talks to Supabase.
  See [Modules → Library modules → eventsService](../modules/09-library-modules.md#eventsservice--src-lib/eventsservicets-supabase-wrappers).

---

**See also**

- [01 · Introduction](./01-introduction.md)
- [02 · Feature matrix](./02-feature-matrix.md)
- [14 · Running the project](../operations/14-running-the-project.md)