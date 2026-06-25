# 13 · Internationalization

> Path: `wiki/design/13-internationalization.md` · Section: **Design**

Translations live as flat JSON under the `app` namespace in
[`src/locales/`](../../src/locales/). The project bundles six locales.

## Bundled locales

| File | Language | Code |
| --- | --- | --- |
| [`en.json`](../../src/locales/en.json) | English | `en` |
| [`fr.json`](../../src/locales/fr.json) | Français | `fr` |
| [`es.json`](../../src/locales/es.json) | Español | `es` |
| [`de.json`](../../src/locales/de.json) | Deutsch | `de` |
| [`it.json`](../../src/locales/it.json) | Italiano | `it` |
| [`pt.json`](../../src/locales/pt.json) | Português | `pt` |

## Configuration

[`src/lib/i18n.ts`](../../src/lib/i18n.ts) sets up `i18next` with:

* `LanguageDetector` — auto-detects the browser language.
* `initReactI18next` — React bindings.
* `fallbackLng: 'en'` — silently falls back to English.

## Date locale

[`src/lib/dateLocale.ts`](../../src/lib/dateLocale.ts) maps the active
language to a `date-fns` locale object:

```ts
import { getDateLocale } from '@/lib/dateLocale';

const locale = getDateLocale(i18n.language); // → date-fns Locale
format(date, 'PP', { locale });
```

`fallbackLng` is `enUS`.

## Adding a new translation key

Every key must be added to **all six** files in lock-step. Missing keys
fall back to English silently — translations disappear without warnings.

### Workflow

1. Add the key to [`src/locales/en.json`](../../src/locales/en.json) under
   the `"app"` namespace:

   ```json
   { "app": { "myKey": "Hello, world!" } }
   ```

2. Mirror the key in `fr.json`, `es.json`, `de.json`, `it.json`, `pt.json`.
3. Use it in any component:

   ```tsx
   const { t } = useTranslation();
   return <p>{t('app.myKey')}</p>;
   ```

### Validation

Run `npm run lint` (TypeScript) to catch missing imports. There is no
runtime check that all six files are in sync — consider adding a CI step
that diffs the keys.

## Adding a new locale

1. Create `src/locales/<code>.json`.
2. Register it in [`src/lib/i18n.ts`](../../src/lib/i18n.ts) (`resources`).
3. Add an entry to the language picker in `SettingsModal`.
4. Add a fallback mapping in `dateLocale.ts` if `date-fns` supports it.

## Pseudo-locale for testing

The codebase does not currently ship a pseudo-locale. To verify that no
hard-coded English strings slipped into the UI, you can temporarily add
one and grep for untranslated output.

---

**See also**

- [03 · Tech stack](../overview/03-tech-stack.md)
- [Modules → Library modules → i18n](../modules/09-library-modules.md#i18nts--src-libi18nts-i18next-bootstrap)
- [Modules → Library modules → dateLocale](../modules/09-library-modules.md#datelocale--src-libdatelocalets-date-fns-locale-mapper)