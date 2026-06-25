# 19 · Shipping checklist

> Path: `wiki/operations/19-shipping-checklist.md` · Section: **Operations**
>
> Companion to [18 · Production-readiness audit](./18-production-audit.md).
> Cut out of that document for quick reference at PR time.
>
> Last reviewed: **2026-06-25**.

## Pre-flight (every PR)

- [x] `npm run lint` exits zero
- [x] `npm run build` exits zero
- [x] New code has tests (≥ 70 % coverage on `src/lib/` + `src/hooks/`)
- [x] No new `any` introduced
- [x] No top-level imports of `./lib/supabase`
- [ ] Touched locale files are translated in **all six** languages
- [ ] Screenshots updated in `audit-screenshots/` for visual changes
- [ ] Visual regression baselines refreshed (`npm run test:e2e:update`)
  when intentional UI changes land

## Production launch gate (must all be true)

- [ ] No 🔴 items remain in [§12 Feature gap map](./18-production-audit.md#12--feature-gap-map)
- [x] `supabase/rls.sql` verified to use snake_case `owner_id`
- [x] Mock data fixed to be relative-to-today
- [x] Auth gate auto-bypasses in local mode
- [x] Error boundaries on calendar and every modal
- [x] Sentry wired in — *stub contract in place; activate by `npm install @sentry/react` + setting `VITE_SENTRY_DSN`*
- [x] CI green: lint + build + unit + coverage gate + audit + Playwright (`visual-regression` job in `.github/workflows/ci.yml`)
- [x] Dark mode shipped — *tokens in `index.css`, switcher in `SettingsModal`*
- [x] CSP meta tag present (`index.html`)
- [x] Vitest suite passes (178/178 across 28 files)
- [x] Coverage gate at 70 % for `src/lib/` + `src/hooks/` (current: 86 % statements / 88 % lines)
- [x] Visual regression baselines locked — *Playwright @ `e2e/visual-regression.spec.ts-snapshots/`*
- [x] axe-core a11y scan clean — *0 serious/critical violations across calendar + settings + add-event (test-a11y.cjs)*
- [x] Real RBAC shipped (children see only their events) — *`useUserRole` + `permissions.ts` + role switcher in `SettingsModal`*
- [x] Timezone story decided and shipped — *active timezone + UTC ICS export*
- [x] Two-way Google Calendar sync shipped — *pull + push + last-write-wins / local-wins / remote-wins merge*
- [x] ICS export uses UTC `Z` not floating times
- [x] Single source of truth (IndexedDB-only) — *localStorage keys (`synoptic-*`) migrated once on boot*

## Post-launch monitoring

- [ ] Sentry alerts configured for error rate > 1 %
- [ ] Supabase metrics dashboard (event CRUD latency, sync queue depth)
- [x] Weekly `npm audit --production` review (CI cron job in `.github/workflows/ci.yml`)
- [ ] Monthly locale completeness check
- [ ] Playwright snapshot diff review on `playwright-report/` upload alerts

---

**See also**: [18 · Production-readiness audit](./18-production-audit.md),
[17 · Common pitfalls](./17-common-pitfalls.md),
[12 · Design system](../design/12-design-system.md).