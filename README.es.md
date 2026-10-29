# a11ycn

Tu agente de código, ahora auditor de accesibilidad para React, Next.js y shadcn/ui.

[![CI](https://github.com/ZenenContreras/a11ycn/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenenContreras/a11ycn/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-0.2.0-blue)](https://github.com/ZenenContreras/a11ycn)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![a11ycn score](https://img.shields.io/badge/a11ycn_score-100-brightgreen)](./docs/demo/after.md)

La insignia es el **a11ycn score** de `apps/demo/after` (100). La misma interfaz con errores sembrados, `apps/demo/before`, saca 0. No es una puntuación oficial de accesibilidad y no significa que un sitio cumpla WCAG.

## Demo

`apps/demo/before` es una página pequeña con App Router y errores a propósito. `apps/demo/after` es la misma interfaz corregida. Salida real del CLI:

```text
a11ycn 0.1.0
apps/demo/before · next-app-router · shadcn
a11ycn score: 0/100
7 files scanned

critical (5)
serious (15)
moderate (4)
```

```text
a11ycn 0.1.0
apps/demo/after · next-app-router · shadcn
a11ycn score: 100/100
7 files scanned

No static findings.
```

Informes completos: [docs/demo/before.md](docs/demo/before.md) y [docs/demo/after.md](docs/demo/after.md).

## Instalación

```bash
npx skills add ZenenContreras/a11ycn
```

`-g` lo instala para todos los proyectos de la máquina. El paquete de npm todavía no está publicado, así que `npx a11ycn` no funciona en esta versión. En este repo: `pnpm install`, `pnpm build` y `pnpm a11ycn`.

| Agente | Ruta del proyecto | Ruta global | Cómo se invoca |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | Pide una auditoría de accesibilidad. |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` | Igual, o adjunta la skill con `@a11ycn`. |
| Codex | `.agents/skills/` | `~/.codex/skills/` | Pide una auditoría o una revisión WCAG. |
| OpenCode | `.agents/skills/` | `~/.config/opencode/skills/` | Pide una auditoría de accesibilidad. |
| GitHub Copilot | `.agents/skills/` | `~/.copilot/skills/` | Pide una auditoría en modo agente. |

Las rutas siguen la [tabla de agentes del Skills CLI](https://github.com/vercel-labs/skills). Para un solo agente: `--agent cursor` (o `claude-code`, `codex`, `opencode`, `github-copilot`).

## Uso

Pídele al agente:

- "Audita esta app en accesibilidad."
- "Haz este diálogo accesible."
- "Este botón de icono no tiene nombre. Arréglalo para un lector de pantalla."

O corre el CLI:

```bash
pnpm install
pnpm build
pnpm a11ycn audit apps/demo/before --format md --out docs/demo/before.md
pnpm a11ycn audit apps/demo/after --fail-on serious
```

`pnpm demo:before` y `pnpm demo:after` guardan Markdown y JSON en `docs/demo/`. El comando before termina con código 2 porque hay hallazgos serious. Esa es la señal para CI.

```bash
pnpm a11ycn audit [ruta]                 # .ts, .tsx y .jsx. Por defecto: ./src y ./app
pnpm a11ycn audit --format md|json|sarif|github
pnpm a11ycn audit --out .a11ycn/report.json
pnpm a11ycn audit --fail-on serious
pnpm a11ycn audit --url http://localhost:3000
pnpm a11ycn audit --lang es
pnpm a11ycn rules
pnpm a11ycn badge
pnpm a11ycn init
```

`--lang` acepta `en` o `es`. Si no lo pasas, el orden es `a11ycn.config.json`, `A11YCN_LANG`, `LANG` / `LC_ALL` y al final inglés. `--url` corre axe-core si Playwright está instalado; si no, el CLI explica cómo instalarlo y sigue con el escaneo estático.

Códigos de salida: `0` si nada supera el umbral, `2` si hay hallazgos, `1` si el escaneo no puede correr.

Ignora una línea con `// a11ycn-disable-next-line icon-button-name`. Ignora el resto del archivo con `/* a11ycn-disable form-label */`.

## Qué revisa

El CLI ejecuta todas las reglas de abajo. El contraste usa la paleta por defecto de Tailwind y las variables de shadcn en `:root` de `globals.css` (`hsl` y `oklch`). Si un color no se puede resolver, el hallazgo queda en `needs_review`.

| Regla | WCAG 2.2 | Nivel | Severidad | En el CLI |
| --- | --- | --- | --- | --- |
| img-alt | 1.1.1 Contenido no textual | A | critical / serious | sí |
| icon-button-name | 4.1.2 Nombre, función, valor | A | critical | sí |
| clickable-non-interactive | 2.1.1 Teclado, 4.1.2 | A | critical | sí |
| focus-visible-removed | 2.4.7 Foco visible | AA | serious | sí |
| form-label | 1.3.1, 3.3.2, 4.1.2 | A | serious | sí |
| html-lang | 3.1.1 Idioma de la página | A | serious | sí |
| page-title | 2.4.2 Página titulada | A | serious / moderate | sí |
| link-name | 2.4.4 Propósito del enlace | A | serious / moderate | sí |
| dialog-title | 4.1.2, 1.3.1 | A | serious / moderate | sí |
| target-size | 2.5.8 Tamaño del objetivo (mínimo) | AA | serious | sí |
| text-contrast | 1.4.3 Contraste (mínimo) | AA | serious | sí |
| non-text-contrast | 1.4.11 Contraste no textual | AA | serious | sí |
| form-error-association | 3.3.1 Identificación de errores | A | serious | sí |
| input-autocomplete | 1.3.5 Identificar el propósito | AA | serious | sí |
| heading-order | 1.3.1 Información y relaciones | A | moderate | sí |
| landmarks-skip-link | 2.4.1 Evitar bloques | A | serious | sí |
| focus-not-obscured | 2.4.11 Foco no oculto (mínimo) | AA | moderate | sí |
| dragging-alternative | 2.5.7 Movimientos de arrastre | AA | serious | sí |
| no-positive-tabindex | 2.4.3 Orden del foco | A | serious | sí |
| aria-valid | 4.1.2 Nombre, función, valor | A | serious | sí |
| viewport-zoom | 1.4.4 Cambio de tamaño del texto | AA | serious | sí |
| paste-blocked | 3.3.8 Autenticación accesible (mínimo) | AA | serious | sí |
| reduced-motion | 2.3.3, 2.2.2 | AAA / A | minor | sí |
| media-captions | 1.2.2 Subtítulos (pregrabados) | A | minor hasta automatizarla | sí |
| status-messages | 4.1.3 Mensajes de estado | AA | serious | sí |

El criterio 4.1.1 Parsing está obsoleto en WCAG 2.2 y no se usa.

El a11ycn score empieza en 100. Cada hallazgo critical resta 15, serious 8, moderate 3 y minor 1. El mínimo es 0.

## Informe de ejemplo

Del demo con errores ([informe completo](docs/demo/before.md)):

### A11Y-0001 clickable-non-interactive

- **WCAG:** 2.1.1 Teclado (A); 4.1.2 Nombre, función, valor (A)
- **Archivo:** `apps/demo/before/app/dashboard/page.tsx:8:7`
- **A quién afecta:** Quien usa solo el teclado no puede llegar a este control ni activarlo.

```tsx
<span onClick={() => {}}>Clear filters</span>
```

```diff
-      <span onClick={() => {}}>Clear filters</span>
+      <button type="button" onClick={() => {}}>Clear filters</button>
```

Todos los informes cierran con: "Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader."

## CLI y CI

El CI de este repo instala, hace lint, typecheck, tests, build, y corre `a11ycn audit apps/demo/after --fail-on serious`.

El JSON cumple [skills/a11ycn/assets/report-schema.json](skills/a11ycn/assets/report-schema.json):

```bash
node skills/a11ycn/scripts/validate-report.mjs docs/demo/before.json
```

`--format sarif` escribe SARIF 2.1.0. `--format github` escribe anotaciones `::error`, `::warning` y `::notice`.

Otros repos pueden usar la action compuesta `ZenenContreras/a11ycn@v1` con `path`, `fail-on`, `format` y `lang`. La action construye este repo; no descarga un paquete de npm.

El paquete no está publicado. `packages/cli/package.json` ya tiene `bin`, `files` y `publishConfig.provenance`. El workflow `.github/workflows/release.yml` solo corre a mano (`workflow_dispatch`) y necesita el secreto `NPM_TOKEN`.

## Estructura

```text
action.yml
i18n/                      inglés y español, y cómo añadir un idioma
skills/a11ycn/             SKILL.md, referencias, schema y validador
packages/cli/              paquete npm a11ycn
packages/eslint-plugin-a11ycn/
apps/demo/before|after/
fixtures/
test/
docs/demo/
.github/workflows/
```

Herramientas compartidas: `eslint.config.js`, `.prettierrc.json`, `tsconfig.base.json`.

## Idiomas

Inglés por defecto. Español cubre el CLI, los encabezados del informe, las revisiones manuales y cada mensaje de hallazgo. Para añadir un idioma, mira [i18n/README.md](i18n/README.md).

## Qué no hace

Las pruebas automáticas no ven todo. Sigue haciendo falta el teclado, un lector de pantalla y pruebas con personas. a11ycn no es un overlay. No certifica cumplimiento WCAG. Un score de 100 solo significa que estas reglas no encontraron nada.

## Principios

- Confirma el hallazgo en el archivo antes de reportarlo. Un botón que ya tiene `<span className="sr-only">` no es un error.
- Cada hallazgo trae un fix en código.
- Sin API key. Sin telemetría.
- Usa un elemento nativo en lugar de poner `role="button"` en un `div`.

## Contribuir

Mira [CONTRIBUTING.md](CONTRIBUTING.md). Una regla nueva necesita id, criterio WCAG 2.2, un fixture malo, uno bueno, y un test que falle exactamente en el malo y quede limpio en el bueno.

Inspirado en [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y), [axe-core](https://github.com/dequelabs/axe-core), [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill), [pbakaus/impeccable](https://github.com/pbakaus/impeccable) y [Nutlope/hallmark](https://github.com/Nutlope/hallmark).

## Licencia

MIT. Ver [LICENSE](LICENSE).
