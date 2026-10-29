# Translations

User-facing CLI text, report headings, manual-check notes, and finding messages live here.

- `en.ts` is the default and the source of keys.
- `es.ts` is the Spanish locale. It must `satisfy` the English catalog, so a missing or extra key fails typecheck.

## Add a locale

1. Copy `en.ts` to `i18n/<code>.ts` (`fr.ts`, `pt.ts`, …).
2. Translate every string. Keep `{{placeholders}}` exactly as they are.
3. Register it in `packages/cli/src/i18n.ts`:

```ts
import { messages as fr } from "../../../i18n/fr.js";

const CATALOGS = { en, es, fr };
```

4. Run `pnpm typecheck` and `pnpm test`. The i18n test checks that every locale has the same keys.

## How a locale is chosen

1. `--lang <code>`
2. `lang` in `a11ycn.config.json`
3. `A11YCN_LANG`
4. The language portion of `LANG` or `LC_ALL` (`es_ES.UTF-8` becomes `es`)
5. `en`

Unknown codes fall back to English for auto-detect, and error if you passed `--lang` explicitly.
