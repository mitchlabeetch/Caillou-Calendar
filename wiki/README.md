# Caillou Family Calendar — Code Wiki

> A structured, agentic-coder-friendly reference to the Caillou Family Calendar
> codebase. This wiki is the canonical documentation for the project, derived from
> [`AGENTS.md`](../AGENTS.md), `package.json`, the `src/` tree and the
> `supabase/functions/` Edge Function.

## At a glance

| Metric | Value |
| --- | --- |
| UI framework | React 19 + TypeScript |
| Build | Vite 6 + Tailwind CSS v4 |
| State | Single `EventsContext` (no Redux/Zustand) |
| Persistence | Supabase (Postgres + Realtime) **or** IndexedDB + localStorage |
| i18n | 6 locales: `en`, `fr`, `es`, `de`, `it`, `pt` |
| Auth | Supabase email/password + Google OAuth |
| Tests | Puppeteer + `tsx` (no Jest/Vitest) |

## Table of contents

### [1 · Overview](./overview/)

| # | File | Summary |
| --- | --- | --- |
| 01 | [Introduction](./overview/01-introduction.md) | What the project is, who it is for, and how to read this wiki. |
| 02 | [Feature matrix](./overview/02-feature-matrix.md) | Complete inventory of user-facing features. |
| 03 | [Tech stack](./overview/03-tech-stack.md) | Languages, libraries and runtime with versions. |

### [2 · Architecture](./architecture/)

| # | File | Summary |
| --- | --- | --- |
| 04 | [System architecture](./architecture/04-system-architecture.md) | Five-tier layered diagram and module responsibilities. |
| 05 | [Data flow](./architecture/05-data-flow.md) | Read/write paths, sync queue and realtime pipeline. |
| 06 | [Sync strategy](./architecture/06-sync-strategy.md) | Supabase-first / local-fallback strategy with mode matrix. |
| 07 | [State management](./architecture/07-state-management.md) | `EventsContext` contract and permissions matrix. |

### [3 · Modules](./modules/)

| # | File | Summary |
| --- | --- | --- |
| 08 | [Entry and root](./modules/08-entry-and-root.md) | `main.tsx` bootstrap and `App.tsx` root responsibilities. |
| 09 | [Library modules](./modules/09-library-modules.md) | `src/lib/*` — one subsection per module. |
| 10 | [UI components](./modules/10-ui-components.md) | `src/components/*` — calendar views, modals, sidebar. |
| 11 | [Type definitions](./modules/11-type-definitions.md) | `src/types.ts` canonical model. |

### [4 · Design System](./design/)

| # | File | Summary |
| --- | --- | --- |
| 12 | [Neo-brutalist style](./design/12-design-system.md) | Color tokens, shadows, borders, print styles. |
| 13 | [Internationalization](./design/13-internationalization.md) | Six bundled locales and translation conventions. |

### [5 · Operations](./operations/14-running-the-project.md)

| # | File | Summary |
| --- | --- | --- |
| 14 | [Running the project](./operations/14-running-the-project.md) | Prerequisites, `npm` scripts, ad-hoc test scripts. |
| 15 | [Environment variables](./operations/15-environment-variables.md) | `VITE_*` vars, security notes, internal switches. |
| 16 | [Build and deploy](./operations/16-build-and-deploy.md) | Production bundle, hosting, Edge Function deploy. |
| 17 | [Common pitfalls](./operations/17-common-pitfalls.md) | Ten mistakes to avoid when modifying the code. |

## Repository layout (quick map)

```
Caillou-Calendar/
├── AGENTS.md                   # Agent-facing project rules (canonical source)
├── package.json                # Scripts + dependencies
├── vite.config.ts              # Vite 6 config (with DISABLE_HMR switch)
├── index.html                  # Vite entry HTML
├── src/
│   ├── App.tsx                 # Root component + global state
│   ├── main.tsx                # i18n init + DnD polyfill + SW registration
│   ├── types.ts                # Core TypeScript types
│   ├── index.css               # Tailwind v4 @theme tokens + print styles
│   ├── components/             # UI components (see modules/10)
│   ├── data/mockData.ts        # Hardcoded mock events
│   ├── hooks/                  # Custom React hooks (useIsMobile)
│   ├── lib/                    # Domain modules (see modules/09)
│   └── locales/                # Translation JSONs (6 languages)
├── public/
│   └── sw.js                   # Minimal service worker (push only)
├── supabase/
│   └── functions/
│       └── push-notification/
│           └── index.ts        # Web Push Edge Function
└── wiki/                       # ← You are here
```

## How to use this wiki

* **For humans**: start at [Overview → Introduction](./overview/01-introduction.md),
  then follow the sidebar of any doc into deeper sections.
* **For coding agents**: jump straight to [State management](./architecture/07-state-management.md)
  and [Library modules](./modules/09-library-modules.md). Cross-references use
  relative links so a tool can follow them without a build step.
* **Before modifying code**: read [Common pitfalls](./operations/17-common-pitfalls.md)
  and [`AGENTS.md`](../AGENTS.md). They are authoritative.
* **Before shipping**: read [18 · Production-readiness audit](./operations/18-production-audit.md)
  and tick the boxes in [19 · Shipping checklist](./operations/19-shipping-checklist.md).

## Conventions used in this wiki

* `code` formatting marks file names, types, function names and short identifiers.
* `relative/path/to/file.ts` marks source paths under the repo root.
* Code blocks are language-tagged (` ```ts `, ` ```bash `, etc.).
* "Source:" links point back to the project root with `../`.
* Every section ends with **See also** linking to adjacent docs.

> **Source of truth**: this wiki is generated from a one-time analysis of
> `AGENTS.md` and the `src/` tree. When the code changes, regenerate the
> affected page rather than editing prose in isolation.