# Caillou Family Calendar — Production-Ready Ultra Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the Caillou Family Calendar from its current audit-clean, partially-hardened state to a fully production-ready applet that boots, runs, syncs, observably, securely, and accessibly for every supported locale on every supported device.

**Architecture:** React 19 + TypeScript (strict) + Vite 6 single-page app on the client, with a Supabase-first / local-fallback backend, a single Edge Function for push, six i18n locales, a neo-brutalist design system, and a custom Vitest + Playwright test stack. State is centralised in `EventsContext` and only exposed through explicit action APIs.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind v4, motion/react, i18next, date-fns, idb, supabase-js, vitest, @testing-library/react, @playwright/test, axe-core, Sentry (optional, environment-gated).

---

## 0 · How to read this plan

This is the **single comprehensive plan** that supersedes every previous plan, audit, checklist, and remediation document. It assumes the engineer has zero context for the codebase and only knows the AGENTS.md rules and this plan.

The plan is structured as five sequential phases, each broken into tasks. Each task has a clear deliverable, an owner (or sub-agent), success criteria, and a verification step.

Caveats and overrides:

* **No destructive changes** to user-edited files. If a task would touch a file the user changed out of band, the task is **blocked** until a human decides.
* **No new top-level static imports of `./lib/supabase`**. The lib must stay lazy.
* **All hard-coded colors / inline class strings** must end up in `src/index.css` `@theme` tokens.
* **No `dangerouslySetInnerHTML` or `innerHTML` in production-rendered paths** — the inline debug overlay was removed; this rule prevents it returning.
* **Plan documents are throwaway** — once a task is verified, the entry is removed from this file in a follow-up cleanup task (T8.5).

Goal alignment:

* Primary product goal: families plan together with zero-friction sharing.
* Engineering goal: keep the codebase small, fast, and obvious so future contributors can ship features in days, not weeks.
* Operational goal: zero surprise incidents in production, instant rollback, and full observability.

---

## Phase 1 — Stabilise foundations (1–2 days)

### Task 1.1 · Verify the type/lint baseline and lock the strict config

**Files:** `tsconfig.json`, `package.json`, `src/vite-env.d.ts`

- [ ] **Step 1:** Run `npm run lint` and capture the full output to `audit-screenshots/lint-baseline.txt`. If it is clean, this is the baseline; if it fails, log the failures and stop.
- [ ] **Step 2:** Confirm `tsconfig.json` still has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`. If any of these is missing, add it back and run `npm run lint` to confirm zero new errors.
- [ ] **Step 3:** Commit `src/vite-env.d.ts` if missing, containing only the standard Vite client reference plus a typed `ImportMetaEnv` interface for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_SENTRY_DSN`, `VITE_GOOGLE_CLIENT_ID`.
- [ ] **Step 4:** Run `npm run build` and confirm the bundle is produced with zero warnings related to mixed imports, missing assets, or Vite chunk size. Record the bundle size in `audit-screenshots/build-baseline.txt`.
- [ ] **Step 5:** Commit with `chore: lock strict TS + vite-env.d.ts baseline`.

**Success criteria:** `npm run lint` and `npm run build` both pass cleanly. `tsconfig.json` has all five strict flags enabled.

### Task 1.2 · Establish a CI gate

**Files:** `.github/workflows/ci.yml`

- [ ] **Step 1:** Create a workflow named `ci` triggered on `pull_request` and `push` to `main`. Use `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 20`, then `npm ci`.
- [ ] **Step 2:** Add steps in order: `npm run lint`, `npm run build`, `npm run test:coverage` (coverage threshold: 70% statements for `src/lib/` and `src/hooks/`).
- [ ] **Step 3:** Add a separate `audit` job that runs `node test-app-wiring.cjs` and `node test-a11y.cjs`. Fail the build on any serious/critical axe-core violation.
- [ ] **Step 4:** Add a weekly cron job that runs `npm audit --production --audit-level=high` and posts the result as a workflow artifact.
- [ ] **Step 5:** Commit and push. The first green run is the baseline.

**Success criteria:** CI runs on the open PR and fails on any lint/build/test/a11y regression.

### Task 1.3 · Establish the conventional commit + changelog policy

**Files:** `CONTRIBUTING.md`, `CHANGELOG.md`

- [ ] **Step 1:** Create `CONTRIBUTING.md` describing the commit convention (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `security:`, `a11y:`), the PR template, the test gate, and the “no regression in lint, build, test, coverage, axe, or visual regression” rule.
- [ ] **Step 2:** Add `CHANGELOG.md` and seed it with a 0.1.0 entry summarising the audit findings, the i18n surface, the security model, and the known limitations.
- [ ] **Step 3:** Commit as `docs: contributing + changelog policy`.

**Success criteria:** A new contributor can read `CONTRIBUTING.md` and know exactly how to land a change.

---

## Phase 2 — UI/UX & design system (1 week)

### Task 2.1 · Tokenise every hard-coded color

**Files:** `src/index.css`, all `src/components/*.tsx`, all `src/lib/*.ts`

- [ ] **Step 1:** Search the repo for `#[0-9A-Fa-f]{3,8}` literals and inline `bg-…` / `text-…` classes that bypass the design tokens. Produce a one-page table in `audit-screenshots/colors-inventory.md` mapping each occurrence to a token.
- [ ] **Step 2:** Add the missing tokens to `src/index.css` `@theme` block: `--color-danger`, `--color-warning`, `--color-success`, `--color-bg-app` (the page yellow-green), `--color-surface-alt`, and a dark-mode counterpart for each.
- [ ] **Step 3:** Replace every literal with the appropriate `bg-danger`, `text-warning`, `bg-app`, etc. Run `npm run lint` and `npm run build` after each component.
- [ ] **Step 4:** Run the visual regression suite (`npm run test:e2e:update`) to refresh baselines after the color change.
- [ ] **Step 5:** Commit as `design: tokenise all hard-coded colors`.

**Success criteria:** A repo-wide grep for hex literals (excluding `index.css`) returns zero results.

### Task 2.2 · Add a custom drag preview and improve touch drag affordance

**Files:** `src/hooks/useCustomDragPreview.ts`, `src/components/CalendarMonth.tsx`, `src/components/CalendarWeek.tsx`, `src/hooks/useIsMobile.ts`

- [ ] **Step 1:** Build a `useCustomDragPreview` hook that, on `dragstart`, captures a snapshot of the event pill and renders it into a `position: fixed` ghost element following the pointer. Honor `prefers-reduced-motion`.
- [ ] **Step 2:** Wire the hook into both calendar views. Remove the browser default ghost with `event.dataTransfer.setDragImage(new Image(), 0, 0)`.
- [ ] **Step 3:** Expose the hold-to-drag threshold in `SettingsModal` (persisted via `useTheme` style setting, range 100–600 ms, default 300). Apply on the next mount.
- [ ] **Step 4:** Add unit tests for the hook (timer behaviour) and a Playwright test that confirms the custom preview is visible mid-drag.
- [ ] **Step 5:** Commit as `feat: custom drag preview + configurable hold time`.

**Success criteria:** Dragging an event shows the branded pill preview. Power users can adjust hold time in settings.

### Task 2.3 · Real dark mode with a tokenised palette

**Files:** `src/index.css`, `src/hooks/useTheme.ts`, `src/components/SettingsModal.tsx`

- [ ] **Step 1:** Audit every `@theme` token for a dark-mode counterpart. Add a `[data-theme="dark"]` block mirroring every CSS variable. Run a visual diff against the existing dark tokens shipped in `index.css`.
- [ ] **Step 2:** Add a “System Default” option (in addition to Light/Dark) that uses `matchMedia('(prefers-color-scheme: dark)')` to pick the palette at boot and on system theme change.
- [ ] **Step 3:** Make sure all 6 locales translate the “System Default”, “Light”, “Dark” strings; see Task 4.1.
- [ ] **Step 4:** Add an axe-core test for color contrast in dark mode and a Playwright snapshot test for both palettes.
- [ ] **Step 5:** Commit as `feat: real dark mode with system-default option`.

**Success criteria:** Switching the system theme toggles the app palette within one frame. axe-core reports 0 serious/critical contrast violations in either mode.

### Task 2.4 · Empty state + onboarding

**Files:** `src/components/CalendarMonth.tsx`, `src/components/CalendarAgenda.tsx`, `src/components/OnboardingSplash.tsx`

- [ ] **Step 1:** When `events.length === 0`, render an `EmptyState` component with a hero illustration, a one-sentence value prop, and a primary CTA “Add your first event”.
- [ ] **Step 2:** On first run (`localStorage.caillou-onboarding-shown !== '1'`), open `OnboardingSplash` and walk through (1) add family, (2) pick members to filter, (3) add first event.
- [ ] **Step 3:** Localise the onboarding copy in all 6 locales.
- [ ] **Step 4:** Add Playwright tests for the empty state and the splash flow.
- [ ] **Step 5:** Commit as `feat: empty state + first-run onboarding`.

**Success criteria:** A brand-new browser profile sees a guided experience; the calendar is never empty without an explanation.

### Task 2.5 · Keyboard equivalent of drag-and-drop

**Files:** `src/components/EventDetailModal.tsx`, `src/components/CalendarMonth.tsx`, `src/components/CalendarWeek.tsx`

- [ ] **Step 1:** Add a “Move to…” action in `EventDetailModal` that opens a date picker. On confirm, call the same `moveEvent` action that drag uses.
- [ ] **Step 2:** Add a keyboard shortcut `Shift+M` while focused on an event pill that opens the move picker.
- [ ] **Step 3:** Add `aria-keyshortcuts` to the move button.
- [ ] **Step 4:** Add a Playwright test for keyboard-only event move.
- [ ] **Step 5:** Commit as `a11y: keyboard equivalent of drag-and-drop`.

**Success criteria:** A keyboard-only user can move events between days.

### Task 2.6 · Focus management polish

**Files:** `src/components/ModalShell.tsx`, every `*Modal.tsx`

- [ ] **Step 1:** Verify every modal returns focus to the invoking element on close. Add a test for each.
- [ ] **Step 2:** Verify `Escape` closes every modal. Add tests.
- [ ] **Step 3:** Verify focus is moved into the modal on open. Add tests.
- [ ] **Step 4:** Document the focus contract in `ModalShell` JSDoc.
- [ ] **Step 5:** Commit as `a11y: focus management polish`.

**Success criteria:** axe-core reports 0 focus-trap violations; manual keyboard test passes for every modal.

### Task 2.7 · Visual regression suite is mandatory

**Files:** `e2e/visual-regression.spec.ts`, `e2e/visual-regression.spec.ts-snapshots/`

- [ ] **Step 1:** Extend the existing snapshot list to cover every modal, every view, every theme, and every member-filter combination.
- [ ] **Step 2:** Fail the build on any `toHaveScreenshot()` mismatch.
- [ ] **Step 3:** Document the `npm run test:e2e:update` workflow in `CONTRIBUTING.md`.
- [ ] **Step 4:** Commit as `test: full visual regression coverage`.

**Success criteria:** Any unintended visual change is caught at PR time.

---

## Phase 3 — Quality assurance (1 week)

### Task 3.1 · Unit tests for every pure module

**Files:** `src/lib/permissions.ts`, `src/lib/utils.ts`, `src/lib/dateLocale.ts`, `src/lib/timezone.ts`, `src/lib/i18n.ts`, `src/lib/exportIcs.ts`

- [ ] **Step 1:** For each module, add a `*.test.ts` file with at least one test per exported function. Cover edge cases: empty input, leap year, DST boundary, recurring event, RBAC matrix.
- [ ] **Step 2:** For `permissions.ts`, write a matrix test that runs every (role × action) pair.
- [ ] **Step 3:** For `exportIcs.ts`, add golden-file tests for UTC vs floating times, all-day, multi-day, recurrence.
- [ ] **Step 4:** Run `npm run test:coverage` and confirm ≥ 90% statements on the targeted modules.
- [ ] **Step 5:** Commit as `test: unit coverage for lib modules`.

**Success criteria:** Coverage for `src/lib/` exceeds 90% statements and 85% branches.

### Task 3.2 · Component tests for every modal

**Files:** `src/components/*Modal.test.tsx`

- [ ] **Step 1:** For each modal (`AddEventModal`, `EventDetailModal`, `DayEventsModal`, `SettingsModal`, `FamilyModal`, `PlacesModal`, `SetStatusModal`, `PrintPreviewModal`), add a `*.test.tsx` that covers: open/close, primary action, secondary action, error path, keyboard escape.
- [ ] **Step 2:** Add RBAC tests for `EventDetailModal` (admin / member / child).
- [ ] **Step 3:** Use `userEvent` (not `fireEvent`) for realistic interaction.
- [ ] **Step 4:** Run coverage and confirm ≥ 80% statements on `src/components/`.
- [ ] **Step 5:** Commit as `test: modal component coverage`.

**Success criteria:** Every modal has at least three tests that pass on `main`.

### Task 3.3 · End-to-end tests for the critical user flows

**Files:** `e2e/`

- [ ] **Step 1:** Add Playwright specs for: sign-in (local + Google stub), create event, edit event, delete event, multi-select, recurring event, ICS export, Google push (mocked), push subscription toggle.
- [ ] **Step 2:** Add a Playwright test that signs in as a child role and asserts no edit affordances.
- [ ] **Step 3:** Add a Playwright test that signs out and asserts no cached data leaks to the next sign-in.
- [ ] **Step 4:** Add a Playwright test that exercises `prefers-reduced-motion`.
- [ ] **Step 5:** Commit as `test: e2e critical flows`.

**Success criteria:** The full Playwright suite runs in < 5 minutes locally and < 8 minutes in CI.

### Task 3.4 · Mutation testing for the sync engine

**Files:** `src/lib/syncEngine.test.ts`, `src/lib/syncActions.test.ts`

- [ ] **Step 1:** Add tests for every branch of `syncInsert`, `syncUpdate`, `syncDelete`: offline, online, network failure, optimistic rollback, duplicate detection.
- [ ] **Step 2:** Add a property test that fuzzes the merge logic with random sequences of inserts/updates/deletes and asserts idempotency.
- [ ] **Step 3:** Commit as `test: sync engine mutation coverage`.

**Success criteria:** A code reviewer can see that every branch is exercised.

### Task 3.5 · Error reporting wiring

**Files:** `src/lib/errorReporting.ts`, `src/components/ErrorBoundary.tsx`, `src/main.tsx`

- [ ] **Step 1:** Decide: Sentry if `VITE_SENTRY_DSN` is set, otherwise a no-op logger that writes to `localStorage.caillou-error-log` capped at 50 entries.
- [ ] **Step 2:** Wire `ErrorBoundary` to call `errorReporting.captureException`.
- [ ] **Step 3:** Wire `window.addEventListener('unhandledrejection', ...)` and `window.onerror` to the same logger.
- [ ] **Step 4:** Add a `Settings → Diagnostics` panel that lets the user copy the log.
- [ ] **Step 5:** Commit as `feat: error reporting wiring`.

**Success criteria:** A thrown error in a modal is captured, visible in dev, and shipped to Sentry in prod.

### Task 3.6 · Lighthouse + performance budget

**Files:** `.lighthouserc.json`, `package.json`

- [ ] **Step 1:** Add a Lighthouse CI config that asserts: performance ≥ 90, accessibility = 100, best practices ≥ 95, SEO ≥ 90.
- [ ] **Step 2:** Add a script `npm run perf` that runs Lighthouse against the production build.
- [ ] **Step 3:** If the budget fails, identify the top 3 offenders (typically Vite chunk size, image weight, font weight) and either fix them or raise the budget with a written justification in the PR.
- [ ] **Step 4:** Commit as `ci: lighthouse budget`.

**Success criteria:** `npm run perf` is green; CI blocks any future regression.

---

## Phase 4 — Security, i18n, and bug-proofing (1 week)

### Task 4.1 · Audit and complete all 6 locales

**Files:** `src/locales/*.json`

- [ ] **Step 1:** Write a script `scripts/audit-locales.mjs` that loads every locale and walks the `en.json` key tree, flagging any key missing in another locale. Run it; record the diff in `audit-screenshots/locales-gaps.md`.
- [ ] **Step 2:** For each missing key, either translate it (preferred) or remove the inline fallback string from the source code so future gaps are visible.
- [ ] **Step 3:** Re-run the script and assert zero gaps.
- [ ] **Step 4:** Add a Vitest test that asserts every locale loads without console warnings and contains the same key set as `en.json`.
- [ ] **Step 5:** Commit as `i18n: complete locale parity`.

**Success criteria:** All six locales have 100% key parity. No inline fallback strings remain in the source.

### Task 4.2 · Pluralisation + ICU

**Files:** `src/lib/i18n.ts`, `src/locales/*.json`

- [ ] **Step 1:** Add `i18next-icu` and configure `i18n.ts` with `compatibilityJSON: 'v4'` and the ICU backend.
- [ ] **Step 2:** Convert existing plural strings to ICU form (`{count, plural, one {# event} other {# events}}`).
- [ ] **Step 3:** For Italian, Portuguese, French, Spanish, verify the plural rules against actual test counts (0, 1, 2, 5, 11).
- [ ] **Step 4:** Add Vitest tests for the plural rules.
- [ ] **Step 5:** Commit as `i18n: ICU plurals`.

**Success criteria:** All plural strings use ICU and pass locale-specific tests.

### Task 4.3 · CSP, SRI, security headers

**Files:** `index.html`, `vite.config.ts`, `public/_headers`

- [ ] **Step 1:** Tighten the existing CSP in `index.html`: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'`.
- [ ] **Step 2:** Add `<meta http-equiv="Permissions-Policy" content="geolocation=(), camera=(), microphone=()">`.
- [ ] **Step 3:** Add `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- [ ] **Step 4:** Document the SRI requirement for any future CDN-loaded assets in `wiki/operations/15-environment-variables.md`.
- [ ] **Step 5:** Commit as `security: tighten CSP and add Permissions-Policy`.

**Success criteria:** A report-only CSP report shows zero violations on a fresh load.

### Task 4.4 · RBAC server-side enforcement

**Files:** `supabase/rls.sql`, `supabase/functions/push-notification/index.ts`

- [ ] **Step 1:** Audit every RLS policy in `supabase/rls.sql` to ensure it uses `owner_id` (snake_case) and the auth.uid() / auth.jwt() functions correctly.
- [ ] **Step 2:** Add a `users` table with `id uuid primary key references auth.users, role text not null default 'member' check (role in ('admin','member','child'))` plus an RLS policy.
- [ ] **Step 3:** Update the push Edge Function to look up `users.role` and `users.family_id` for the affected event’s owner, and fan out only to the matching `user_subscriptions`.
- [ ] **Step 4:** Add a Postgres test (`supabase/tests/rls.test.sql`) using `pgTAP` that asserts: another user can’t read my events, a child can’t update family settings, etc.
- [ ] **Step 5:** Commit as `security: RLS + push fan-out server-enforced`.

**Success criteria:** Manual test confirms a child account cannot update another family member’s events, even with the client UI forced to admin.

### Task 4.5 · Sign-out cache purge

**Files:** `src/hooks/useAuth.ts`, `src/lib/localDb.ts`, `src/lib/storageScope.ts`

- [ ] **Step 1:** Verify the existing user-scoped IndexedDB partition is the single source of truth.
- [ ] **Step 2:** On sign-out, call `clearActiveStorageScope()` and verify the previous user’s cached events, family, places, settings, and outbound queue are not readable from the new session.
- [ ] **Step 3:** Add a Playwright test: sign in as A, create an event, sign out, sign in as B, assert B does not see A’s event.
- [ ] **Step 4:** Add a Vitest test for the storage scope helpers.
- [ ] **Step 5:** Commit as `security: verify sign-out cache isolation`.

**Success criteria:** No cross-account data leakage on a shared browser profile.

### Task 4.6 · Defensive input validation

**Files:** `src/components/AddEventModal.tsx`, `src/lib/utils.ts`

- [ ] **Step 1:** Add a `validateEventInput(payload): { ok: boolean, errors: Record<string,string> }` helper.
- [ ] **Step 2:** Apply it in `AddEventModal` on submit and in `EventDetailModal` on save. Render errors inline, focus the first invalid field.
- [ ] **Step 3:** Add boundary tests: 10MB title, 100 attendees, event spanning 5 years, birth date in the future, end before start.
- [ ] **Step 4:** Add a Playwright test that fills the title with `<script>alert(1)</script>` and confirms it is rendered as text, never executed.
- [ ] **Step 5:** Commit as `security: defensive input validation`.

**Success criteria:** No XSS vector remains in any user-input field; validation is uniform across the app.

### Task 4.7 · Rate limiting and abuse prevention

**Files:** `src/hooks/useAuth.ts`, `supabase/functions/push-notification/index.ts`

- [ ] **Step 1:** Add a simple in-memory rate limiter (5 attempts per 60 seconds) on email sign-in and sign-up.
- [ ] **Step 2:** Add a per-IP rate limit on the push Edge Function (10 calls per minute) using a Supabase table.
- [ ] **Step 3:** Add Vitest tests for the rate limiter.
- [ ] **Step 4:** Commit as `security: rate limiting`.

**Success criteria:** Brute-force sign-in attempts are throttled; push spam is throttled.

### Task 4.8 · Bug-proofing the date and recurrence math

**Files:** `src/lib/utils.ts`, `src/components/CalendarMonth.tsx`, `src/components/CalendarWeek.tsx`

- [ ] **Step 1:** Add a Vitest suite with property-based tests (`fast-check`) for: `getDayEvents` over 1,000 random event sets; recurrence expansion for daily/weekly/monthly/yearly; DST boundaries; leap years; negative timezone offsets.
- [ ] **Step 2:** Add a regression test for every historical “off-by-one” bug in the audit.
- [ ] **Step 3:** Commit as `test: date + recurrence property tests`.

**Success criteria:** A 1-minute `fast-check` run completes with zero failures.

### Task 4.9 · Bug-proofing the sync queue

**Files:** `src/lib/syncEngine.ts`, `src/lib/localDb.ts`

- [ ] **Step 1:** Add a property test that randomly interleaves online/offline events and asserts the queue converges to the server state.
- [ ] **Step 2:** Add a test that asserts the queue does not grow unbounded (cap at 1,000 entries with oldest-evicted policy).
- [ ] **Step 3:** Add a metric (toast or Sentry counter) when `outbound_queue.length > 100`.
- [ ] **Step 4:** Commit as `test: sync queue property tests`.

**Success criteria:** A simulated 24-hour network partition ends in a consistent state.

---

## Phase 5 — Feature completion and final docs (1 week)

### Task 5.1 · Multi-day all-day event UI

**Files:** `src/components/AddEventModal.tsx`, `src/lib/utils.ts`

- [ ] **Step 1:** Add a `multiDay` toggle in `AddEventModal`. When enabled, show `startDate` and `endDate` instead of a single date.
- [ ] **Step 2:** Render multi-day events as a continuous bar in Month and Week views.
- [ ] **Step 3:** Add Vitest + Playwright tests.
- [ ] **Step 4:** Commit as `feat: multi-day all-day event UI`.

**Success criteria:** A user can create a 3-day all-day event from the UI; Google Calendar receives the same event with exclusive end.

### Task 5.2 · Event categories and tags

**Files:** `src/types.ts`, `src/components/AddEventModal.tsx`, `src/components/EventDetailModal.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1:** Add `tags: string[]` to `CalendarEvent`. Default to `[]`. Migrate existing events on read.
- [ ] **Step 2:** Add a tag picker in `AddEventModal` and `EventDetailModal` with autocomplete from existing tags.
- [ ] **Step 3:** Add a tag filter chip group in the sidebar.
- [ ] **Step 4:** Add tests + a migration to backfill tags from existing `category` if present.
- [ ] **Step 5:** Commit as `feat: event tags + filter`.

**Success criteria:** Users can tag events and filter by tag.

### Task 5.3 · ICS import

**Files:** `src/lib/icsImport.ts` (new), `src/components/SettingsModal.tsx`

- [ ] **Step 1:** Build an ICS parser using a small, audited library (`ical.js` or hand-rolled with Vitest coverage).
- [ ] **Step 2:** Wire it into `SettingsModal → Import` (already partially there).
- [ ] **Step 3:** Add tests for: simple event, recurring event, all-day, multi-day, malformed file.
- [ ] **Step 4:** Commit as `feat: ICS import`.

**Success criteria:** A user can import a `.ics` file from another calendar and see the events.

### Task 5.4 · Two-way Google Calendar sync

**Files:** `src/lib/googleCalendar.ts`

- [ ] **Step 1:** Confirm the existing pull / push / merge flow is complete and tested.
- [ ] **Step 2:** Add UI in `SettingsModal` to trigger a manual pull and to pick a merge strategy (last-write-wins / local-wins / remote-wins).
- [ ] **Step 3:** Add a Playwright test that mocks the Google API and asserts the right events are inserted/updated/deleted.
- [ ] **Step 4:** Commit as `feat: two-way Google Calendar sync UX`.

**Success criteria:** A user can pull events from Google, see a diff, and choose how to merge.

### Task 5.5 · Virtualised month grid

**Files:** `src/components/CalendarMonth.tsx`

- [ ] **Step 1:** Add `react-window` (or `virtua`) for the day grid.
- [ ] **Step 2:** Memoize `eventsByDay` with `useMemo` keyed on `events`, `currentMonth`, `selectedMembers`.
- [ ] **Step 3:** Add a performance test: render with 5,000 events and assert frame time < 16ms.
- [ ] **Step 4:** Commit as `perf: virtualised month grid`.

**Success criteria:** A 5,000-event month renders under 16ms/frame in DevTools performance.

### Task 5.6 · Search + command palette

**Files:** `src/components/CommandPalette.tsx`

- [ ] **Step 1:** Confirm the existing `CommandPalette` is wired to `Cmd/Ctrl+K`.
- [ ] **Step 2:** Add fuzzy search across event titles, locations, members, tags.
- [ ] **Step 3:** Add recent + pinned items.
- [ ] **Step 4:** Add Playwright test for `Cmd+K` flow.
- [ ] **Step 5:** Commit as `feat: search + command palette`.

**Success criteria:** `Cmd+K` opens a search palette that returns results within one frame.

### Task 5.7 · Timezone selection

**Files:** `src/lib/timezone.ts`, `src/components/SettingsModal.tsx`

- [ ] **Step 1:** Add a timezone picker in `SettingsModal` (default = browser, list of common zones, custom `IANA` input).
- [ ] **Step 2:** Store the chosen zone in user settings and use it for all date formatting, Google Calendar push, and ICS export.
- [ ] **Step 3:** Add tests for zone-aware event creation, DST transition, and travel scenarios.
- [ ] **Step 4:** Commit as `feat: explicit timezone selection`.

**Success criteria:** A user in Paris who travels to Sydney sees their events at the right local time.

### Task 5.8 · Documentation refresh

**Files:** `wiki/**`, `AGENTS.md`, `README.md`

- [ ] **Step 1:** Refresh `AGENTS.md` to reflect the current file layout and scripts.
- [ ] **Step 2:** Update `wiki/modules/09-library-modules.md` to remove references to `eventsService.ts` and `firebase.ts` if they no longer exist, or to describe the actual current files.
- [ ] **Step 3:** Add a `wiki/operations/20-shipping-process.md` describing the launch gate, the rollback procedure, and the post-launch monitoring checklist.
- [ ] **Step 4:** Add a `wiki/architecture/07-state-management.md` diagram showing the action API and storage scopes.
- [ ] **Step 5:** Commit as `docs: refresh AGENTS + wiki for current state`.

**Success criteria:** A new contributor can run the project, understand its architecture, and ship a feature using only the docs.

### Task 5.9 · Bundle size final pass

**Files:** `vite.config.ts`, `src/App.tsx`

- [ ] **Step 1:** Add `build.rollupOptions.output.manualChunks` to split `motion`, `framer-motion`, `date-fns`, and `i18next` into their own chunks.
- [ ] **Step 2:** Lazy-load every modal with `React.lazy` + `Suspense`.
- [ ] **Step 3:** Replace the remaining `import('./lib/supabase')` sites in `useAuth` / `useUserRole` with the existing dynamic wrapper if not already done.
- [ ] **Step 4:** Confirm the main bundle is under 500 kB minified.
- [ ] **Step 5:** Commit as `perf: bundle split + lazy modals`.

**Success criteria:** Main JS chunk < 500 kB minified. Initial page load < 1s on a 3G profile.

### Task 5.10 · Final smoke + launch rehearsal

**Files:** `docs/launch-runbook.md`

- [ ] **Step 1:** Run the full CI suite locally: `npm run lint && npm run build && npm run test:coverage && npm run test:e2e`.
- [ ] **Step 2:** Run `node test-app-wiring.cjs` and `node test-a11y.cjs`.
- [ ] **Step 3:** Run `npm run perf` and capture the Lighthouse report in `audit-screenshots/lighthouse-final.html`.
- [ ] **Step 4:** Write `docs/launch-runbook.md` describing the deploy steps, the rollback steps, the Sentry project, the Supabase migrations, and the Edge Function deploy.
- [ ] **Step 5:** Commit as `docs: launch runbook`.

**Success criteria:** The full suite is green; the runbook exists; the team has rehearsed the deploy once.

---

## 6 · Cross-cutting concerns (apply to every task)

* **Testing:** every feature task MUST include Vitest + Playwright coverage before commit. No “we’ll test later”.
* **A11y:** every new component MUST pass axe-core (0 serious/critical) and be keyboard-operable end-to-end.
* **i18n:** every new user-visible string MUST be added to all 6 locales via the audit script before commit.
* **Security:** every new entry point that touches the network, storage, or auth MUST go through the established wrappers (`syncActions`, `localDb`, `useAuth`, `pushNotificationSecurity`).
* **Performance:** every render-heavy change MUST be profiled in DevTools and recorded in the PR.
* **Docs:** every new feature MUST update the relevant wiki page in the same PR.

## 7 · Success criteria (overall)

* `npm run lint` clean
* `npm run build` clean
* `npm run test:coverage` ≥ 70% statements for `src/lib/` + `src/hooks/`
* `npm run test:e2e` green
* `node test-app-wiring.cjs` green
* `node test-a11y.cjs` 0 serious/critical
* `npm run perf` Lighthouse ≥ 90 perf, 100 a11y, ≥ 95 best-practices
* Main JS bundle < 500 kB minified
* All 6 locales 100% key parity
* RLS server-enforced per-user
* Sign-out cache isolation verified
* No `dangerouslySetInnerHTML` / `innerHTML` in production paths
* CI green on `main`

## 8 · Caveats and overrides

* Tasks 2.5, 2.6, and 5.6 depend on the existing `eventsContext` action API; if it is missing a method, the implementing sub-agent must add it first and call it out in the PR.
* Task 4.4 requires operational coordination with whoever owns the Supabase project; the PR should include the migration files but the deploy is separate.
* Task 5.5 may bump the bundle size before it shrinks; profile before/after.
* Tasks touching `App.tsx` are higher risk — limit App.tsx changes to the specific lines described and prefer extracting new code to `src/hooks/` or `src/lib/`.
* If the implementing engineer discovers that any task is blocked by a non-long-term doc or stale plan in the repo, stop and ask; do not invent.

## 9 · Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Visual regressions after tokenisation | Users notice UI changes | Run `npm run test:e2e:update` and review the diff in the PR |
| RBAC server migration is irreversible on a live DB | Production data loss | Use a Supabase migration file and a test tenant first |
| Bundle size worsens with new features | Slow load | Track in CI with a budget and review before/after |
| Locale drift | Non-English users see English fallbacks | Run `scripts/audit-locales.mjs` in CI |
| Coverage gate trips and blocks PRs | Team velocity | Set the gate at 70% statements and raise it by 5%/quarter |

## 10 · Self-review checklist (run after writing this plan)

* [ ] Every section in this plan is concrete: a sub-agent can pick up any task and execute it without asking.
* [ ] Every task has explicit success criteria.
* [ ] Every task that touches the calendar, auth, or sync paths lists the relevant wrapper to use.
* [ ] Every test gate is named with the exact command and the exact threshold.
* [ ] No `TBD`, no `TODO`, no `we’ll add later`, no `similar to Task N`.
* [ ] The plan’s file list is complete and consistent with the current repo.

---

**End of plan.**
