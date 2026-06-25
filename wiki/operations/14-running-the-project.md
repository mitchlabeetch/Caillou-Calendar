# 14 · Running the project

> Path: `wiki/operations/14-running-the-project.md` · Section: **Operations**

## Prerequisites

* **Node.js** ≥ 18
* **npm** ≥ 9
* A modern browser with IndexedDB, Web Push, and Service Worker support.

## Install

```bash
npm install
```

This installs React 19, Vite 6, Tailwind v4, Supabase, and the rest of
the runtime dependencies listed in
[Tech stack](../overview/03-tech-stack.md).

## Environment setup (optional)

```bash
cp .env.example .env.local
# fill in Supabase + VAPID keys if you have them
```

Without env vars the app boots in **local-only mode** — see
[Sync strategy → Local-only mode](../architecture/06-sync-strategy.md#local-only-mode).

## `npm` scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server on `0.0.0.0:3000`. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Type-check only (`tsc --noEmit`). |
| `npm run clean` | Remove `dist/` and `server.js`. Uses `rm -rf` — see [pitfall #6](./17-common-pitfalls.md#6-running-npm-run-clean-on-windows). |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Ad-hoc testing scripts

The repo has no Jest/Vitest. Instead, the following scripts live at the
repo root and are run with Node directly:

| Script | What it does |
| --- | --- |
| `node test-browser.cjs` | Puppeteer smoke test against `localhost:3000`. |
| `node test-browser-modal.cjs` | Modal open / close flow. |
| `node test-date.cjs` | Date utility checks. |
| `npx tsx test-date.ts` | Same as above but TypeScript via `tsx`. |
| `npx tsx test-render.tsx` | React render smoke test (`tsx` + `esbuild`). |

### Running the browser tests

1. Start `npm run dev` in one terminal.
2. Run `node test-browser.cjs` (or any other `.cjs` script) in another.

## Useful one-liners

```bash
# Format on save (optional, requires prettier in user setup)
npx prettier --write src/

# Type-check only
npm run lint

# Open the production build in the browser
npm run build && npm run preview
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| App crashes on load with `getSupabase is not defined` or similar | Top-level `import` of `lib/supabase.ts` | Lazy-import it inside `useEffect` (pitfall [#1](./17-common-pitfalls.md#1--top-level-import)). |
| Drag-and-drop broken on mobile | Polyfill removed from `main.tsx` | Restore `import 'mobile-drag-drop'` (pitfall [#4](./17-common-pitfalls.md#4--removing-mobile-drag-drop-from-maintsx)). |
| `npm run clean` fails on Windows | Uses `rm -rf` | Use `rmdir /s /q dist` instead (pitfall [#6](./17-common-pitfalls.md#6-running-npm-run-clean-on-windows)). |
| Realtime updates missing | Postgres `owner_id` mismatch | Confirm the session's `user.id` matches the filter in `supabase.ts`. |

---

**See also**

- [03 · Tech stack](../overview/03-tech-stack.md)
- [15 · Environment variables](./15-environment-variables.md)
- [16 · Build and deploy](./16-build-and-deploy.md)
- [17 · Common pitfalls](./17-common-pitfalls.md)