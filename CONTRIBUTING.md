# Contributing to Caillou Calendar

Thanks for contributing! This document explains how to land a change safely.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Allowed types:

| Type       | Purpose                                         |
|------------|-------------------------------------------------|
| `feat`     | A new user-visible feature                      |
| `fix`      | A bug fix                                       |
| `chore`    | Tooling, deps, build, infra                     |
| `refactor` | Code change that neither fixes nor adds         |
| `test`     | Adding or fixing tests (no production change)   |
| `docs`     | Docs only (wiki, CONTRIBUTING, README)          |
| `security` | Security fix or hardening                       |
| `a11y`     | Accessibility improvement                       |
| `perf`     | Performance improvement                         |

PR titles should follow the same convention. Example: `feat: command palette fuzzy search`.

## Pull request template

Every PR must include:

1. **What changed** — one-paragraph summary.
2. **Why** — link to the issue, plan task, or audit finding.
3. **How it was verified** — commands run locally and their results.
4. **Screenshots / recordings** — for any UI change.
5. **Risk & rollback** — what could go wrong and how to undo it.

## Test gate

No PR may land unless **all** of the following pass locally:

| Command                     | Threshold                                     |
|-----------------------------|-----------------------------------------------|
| `npm run lint`              | Zero errors and zero warnings                 |
| `npm run build`             | Bundle produced; size within CI budget (800 KB) |
| `npm run test:coverage`     | ≥ 70% statements for `src/lib/` + `src/hooks/` |
| `npm run test:e2e`          | All Playwright specs green                    |
| `node test-app-wiring.cjs`  | Smoke green (requires `npm run dev`)          |
| `node test-a11y.cjs`        | 0 serious/critical axe-core violations        |

A regression in **any** of these is a release blocker.

## Code conventions

- Strict TypeScript is non-negotiable. No `any`, no `// @ts-ignore` without a justification comment.
- All Supabase modules must be lazy-imported (`import('./lib/supabase')`). Static imports of `src/lib/supabase.ts` will crash the local-only build.
- All hard-coded colors must use `@theme` tokens defined in `src/index.css`.
- No `dangerouslySetInnerHTML` or `innerHTML` in production-rendered paths.
- Every new component must pass axe-core (0 serious/critical) and be keyboard-operable.
- Every new user-visible string must be added to all 6 locales via the `scripts/audit-locales.mjs` script.

## Review checklist

Before requesting review, confirm:

- [ ] Tests added/updated and `npm test` is green
- [ ] Coverage threshold not regressed
- [ ] New strings appear in all 6 locales
- [ ] No new top-level `import` of `src/lib/supabase`
- [ ] No new hex literals outside `src/index.css`
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] PR description includes verification steps