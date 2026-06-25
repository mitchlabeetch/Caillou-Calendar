# 12 · Neo-brutalist design system

> Path: `wiki/design/12-design-system.md` · Section: **Design**

The entire UI is built on a small set of rules: **thick black borders**,
**offset hard shadows**, **saturated colours**, and an off-white
yellow-green background. All tokens live in the `@theme` block of
[`src/index.css`](../../src/index.css).

## Colour tokens

| Token | Value | Usage |
| --- | --- | --- |
| `primary` | `#ff4d15` | Primary actions, today highlight, active filter. |
| `bg-app` | `#fcffe4` | Page background. |
| `bg-light` | `#FAF9F6` | Soft fills, member swatches. |
| `surface` | `#FFFFFF` | Cards, modals, sidebar. |
| `ink` | `#1A1A1A` | Borders, text, shadows. |
| `mem-1` | `#B39DDB` | Family member 1. |
| `mem-2` | `#80CBC4` | Family member 2. |
| `mem-3` | `#FFAB91` | Family member 3. |
| `mem-4` | `#F48FB1` | Family member 4. |

## Shadows

| Token | Definition | Use |
| --- | --- | --- |
| `shadow-neo` | `4px 4px 0 #1A1A1A` | Resting cards, buttons. |
| `shadow-neo-hover` | `6px 6px 0 #1A1A1A` | `:hover` state. |

## Borders

Borders are always **thick**:

* `border-[3px]` — most cards and inputs.
* `border-[4px]` / `border-thick` — emphasised surfaces (sidebar, hero).
* Buttons always pair a thick border with `shadow-neo`.

## Typography

* `font-display` and `font-body` both map to **DM Sans**.
* Headings use `font-weight: 900` for the neo-brutalist feel.
* Code uses **JetBrains Mono** (`font-mono`).

## Component conventions

* Buttons always have `hover:-translate-y-1 active:translate-y-1` so they
  "press in" on click.
* Family-member pills use a single colour (e.g. `bg-mem-1`).
* Multi-member events use a **striped CSS gradient** with all four
  member colours:

  ```css
  background: repeating-linear-gradient(
    45deg,
    var(--mem-1) 0 10px,
    var(--mem-2) 10px 20px,
    var(--mem-3) 20px 30px,
    var(--mem-4) 30px 40px
  );
  ```

## Print stylesheet

`@media print` rules in [`src/index.css`](../../src/index.css) hide the
sidebar, modals, FAB and headers; strip shadows; flatten colours so the
printed page is purely informational.

Call `window.print()` from the header to trigger it.

## Tailwind v4 configuration

* Uses `@tailwindcss/vite` plugin — **not** a `tailwind.config.js`.
* Theme tokens defined via `@theme { ... }` in `index.css`.
* `cn()` from [`src/lib/utils.ts`](../../src/lib/utils.ts) merges
  `clsx` + `tailwind-merge`.

### Adding a new token

```css
/* src/index.css — inside the @theme block */
@theme {
  --accent-yellow: #FFD166;
}
```

```tsx
// usage
<div className="bg-accent-yellow text-ink border-4 border-ink shadow-neo">
  ...
</div>
```

### Adding a new member colour

1. Add a new CSS variable in `@theme`:

   ```css
   --mem-5: #FFD166;
   ```

2. Add a corresponding `.bg-mem-5` utility in `index.css` if needed.
3. Update the `FamilyMember.bgClass` type to allow the new class name.

## Do **not**

* Do not introduce gradients outside of the multi-member stripe pattern.
* Do not soften the borders (no `border-2`, no `border`).
* Do not replace the offset shadow with a blur.
* Do not change the page background away from `#fcffe4`.

---

**See also**

- [02 · Feature matrix](../overview/02-feature-matrix.md)
- [13 · Internationalization](./13-internationalization.md)
- [`src/index.css`](../../src/index.css)