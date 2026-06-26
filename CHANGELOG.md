# Changelog

All notable changes to Caillou Calendar are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — Initial pre-release

The first cut of Caillou Calendar that boots, syncs, and ships a coherent design.

### Added

- React 19 + TypeScript + Vite 6 single-page app under `src/`.
- Month, week, and agenda calendar views with drag-and-drop event editing.
- Supabase-first backend with a fully functional local-only fallback (no Supabase env vars required).
- Realtime event sync via `postgres_changes` when authenticated.
- Six locales: English, French, Spanish, German, Italian, Portuguese.
- Neo-brutalist design system: `--color-primary`, member-color tokens, `--shadow-neo`, thick borders.
- Service-worker push notifications (Supabase Edge Function `push-notification`).
- Push events to Google Calendar via the Supabase OAuth `provider_token`.
- ICS export.
- Mobile drag-and-drop via the `mobile-drag-drop` polyfill.
- Keyboard shortcuts: arrow keys for day navigation, `M`/`W` for view switch, `T` for today, `1`–`9` to filter family members.
- Audit baseline: lint, build, unit (Vitest), Playwright visual regression, axe-core a11y smoke (`test-a11y.cjs`), wiring smoke (`test-app-wiring.cjs`).
- Hardened security model: Supabase RLS, Mutation Authorization wrapper, RBAC, signed-out cache purge.

### Security model

- All Supabase tables are protected by row-level security keyed on `owner_id`.
- Server-trusted RBAC for push fan-out (`admin` / `member` / `child`).
- IndexedDB is partitioned per Supabase user; sign-out clears the active scope.
- No `dangerouslySetInnerHTML` in production paths.

### Known limitations

- Drag-and-drop keyboard equivalent is the modal "Move to…" action; full keyboard drag parity is a roadmap item.
- Lighthouse performance budget is enforced in CI but not yet at the 90+ target on low-end devices.
- Visual-regression snapshots cover 5 desktop views; mobile snapshots are partial.
- Bundles are not yet code-split per modal; lazy modals are a roadmap item.