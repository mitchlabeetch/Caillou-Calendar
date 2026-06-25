# 01 · Introduction

> Path: `wiki/overview/01-introduction.md` · Section: **Overview**

## What is Caillou?

**Caillou Family Calendar** is a React 19 + TypeScript single-page web applet
designed to run inside **Google AI Studio**. It is a family-oriented calendar
that supports month, week and agenda views, drag-and-drop event management,
family member tracking with color-coded chips, Google Calendar sync, push
notifications, and internationalisation in six languages.

The defining trait of the codebase is the **Supabase-first, local-fallback**
architecture: the same app boots and remains fully functional with **or**
without Supabase configuration. If `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` are missing, the app runs in **local-only mode**
against IndexedDB with a synthetic `local-user`.

## Who is this for?

* **Families** who want a shared calendar with colour-coded members.
* **Google AI Studio** applet authors looking for a calendar reference app.
* **Coding agents** extending the calendar with new event types, sync targets
  or UI views.

## What is in this wiki?

The wiki is organised into five sections that mirror the codebase's natural
layering:

1. **Overview** — what the project is, what it does, what it is built with.
2. **Architecture** — how state, data, and persistence are wired together.
3. **Modules** — a tour of every file under `src/` and `supabase/functions/`.
4. **Design system** — the neo-brutalist visual language and i18n.
5. **Operations** — how to run, deploy, and avoid breaking things.

## How to read this wiki efficiently

* For a high-level orientation, skim the **Overview** section in order.
* For implementation work, jump to **[Architecture → State management](./07-state-management.md)**
  and **[Modules → Library modules](./09-library-modules.md)**.
* Before any non-trivial edit, read **[Operations → Common pitfalls](./17-common-pitfalls.md)**
  and the canonical [`AGENTS.md`](../../AGENTS.md).

## Source of truth

* **Project rules** → [`AGENTS.md`](../../AGENTS.md) at the repo root.
* **Dependency declarations** → [`package.json`](../../package.json).
* **Type model** → [`src/types.ts`](../../src/types.ts).
* **State container** → [`src/App.tsx`](../../src/App.tsx).

---

**See also**

- [02 · Feature matrix](./02-feature-matrix.md)
- [04 · System architecture](../architecture/04-system-architecture.md)
- [`AGENTS.md`](../../AGENTS.md)