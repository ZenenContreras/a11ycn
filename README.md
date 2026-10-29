# a11ycn

Your coding agent, now an accessibility auditor for React, Next.js and shadcn/ui.

[![CI](https://github.com/ZenenContreras/a11ycn/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenenContreras/a11ycn/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-0.2.0-blue)](https://github.com/ZenenContreras/a11ycn)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![a11ycn score](https://img.shields.io/badge/a11ycn_score-100-brightgreen)](./docs/demo/after.md)

The score badge is the **a11ycn score** of `apps/demo/after` (100). The same app with the seeded issues, `apps/demo/before`, scores 0. This is not an official accessibility score and it does not mean a site is conformant.

## Demo

`apps/demo/before` is a small Next.js App Router page with seeded issues. `apps/demo/after` is the same UI with those issues fixed. Real CLI output:

```text
a11ycn 0.1.0
apps/demo/before · next-app-router · shadcn
a11ycn score: 0/100
7 files scanned

critical (5)
  apps/demo/before/components/header.tsx:11:7  icon-button-name  Icon-only button has no accessible name.
  apps/demo/before/app/page.tsx:12:7  img-alt  Image has no alt attribute.

serious (15)
  apps/demo/before/app/layout.tsx:8:5  html-lang  <html> is missing a lang attribute.
  apps/demo/before/app/register/page.tsx:11:7  form-label  Form control has no label.

moderate (4)
  apps/demo/before/app/page.tsx:18:7  link-name  Link text "read more" does not describe its destination.
```

```text
a11ycn 0.1.0
apps/demo/after · next-app-router · shadcn
a11ycn score: 100/100
7 files scanned

No static findings.
```

Full reports: [docs/demo/before.md](docs/demo/before.md) and [docs/demo/after.md](docs/demo/after.md).

## Install

```bash
npx skills add ZenenContreras/a11ycn
```

Add `-g` to install for every project on the machine. The npm package is not published yet, so `npx a11ycn` will not work until a later release. From this repo, build once and use `pnpm a11ycn`.

| Agent | Project path | Global path | How to invoke |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | Ask for an accessibility audit. The skill description is the trigger. |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` | Same, or attach the skill with `@a11ycn`. |
| Codex | `.agents/skills/` | `~/.codex/skills/` | Ask for an accessibility audit or a WCAG review. |
| OpenCode | `.agents/skills/` | `~/.config/opencode/skills/` | Ask for an accessibility audit. |
| GitHub Copilot | `.agents/skills/` | `~/.copilot/skills/` | Ask for an accessibility audit in agent mode. |

Paths follow the [Skills CLI agent table](https://github.com/vercel-labs/skills). Install for one agent with `--agent cursor` (or `claude-code`, `codex`, `opencode`, `github-copilot`).

## Usage

Ask the agent:

- "Audit this app for accessibility."
- "Make this dialog accessible."
- "This icon button has no name. Fix it for a screen reader."

Or run the CLI:

```bash
pnpm install
pnpm build
pnpm a11ycn audit apps/demo/before --format md --out docs/demo/before.md
pnpm a11ycn audit apps/demo/after --fail-on serious
```

`pnpm demo:before` and `pnpm demo:after` write Markdown and JSON under `docs/demo/`. The before command exits 2 because that tree has serious findings. That is the CI signal.

```bash
pnpm a11ycn audit [path]                 # .ts, .tsx, and .jsx. Default: ./src and ./app
pnpm a11ycn audit --format md|json|sarif|github
pnpm a11ycn audit --out .a11ycn/report.json
pnpm a11ycn audit --fail-on serious      # exit 2 at this severity or higher
pnpm a11ycn audit --rules text-contrast,dialog-title
pnpm a11ycn audit --url http://localhost:3000
pnpm a11ycn audit --lang es
pnpm a11ycn rules
pnpm a11ycn badge
pnpm a11ycn init
```

`--url` also runs axe-core when Playwright and Chromium are installed. If they are not, the CLI prints the install command and continues with the static scan. Overlapping static and browser hits are not listed twice.

`--lang` accepts `en` or `es`. Without it, a11ycn uses `lang` from `a11ycn.config.json`, then `A11YCN_LANG`, then `LANG` / `LC_ALL`, then English.

Exit codes: `0` when nothing fails the threshold, `2` when a finding does, `1` when the scan cannot run.

Ignore a line with `// a11ycn-disable-next-line icon-button-name`. Ignore the rest of the file with `/* a11ycn-disable form-label */`.

## What it checks

The CLI runs every rule below. Contrast uses Tailwind default colors and shadcn variables from `:root` in `globals.css` (`hsl` channels and `oklch`). Colors that cannot be resolved are `needs_review`. Details are in [skills/a11ycn/references/rules.md](skills/a11ycn/references/rules.md).

| Rule | WCAG 2.2 | Level | Severity | In the CLI |
| --- | --- | --- | --- | --- |
| img-alt | 1.1.1 Non-text Content | A | critical / serious | yes |
| icon-button-name | 4.1.2 Name, Role, Value | A | critical | yes |
| clickable-non-interactive | 2.1.1 Keyboard, 4.1.2 Name, Role, Value | A | critical | yes |
| focus-visible-removed | 2.4.7 Focus Visible | AA | serious | yes |
| form-label | 1.3.1, 3.3.2, 4.1.2 | A | serious | yes |
| html-lang | 3.1.1 Language of Page | A | serious | yes |
| page-title | 2.4.2 Page Titled | A | serious / moderate | yes |
| link-name | 2.4.4 Link Purpose (In Context) | A | serious / moderate | yes |
| dialog-title | 4.1.2, 1.3.1 | A | serious / moderate | yes |
| target-size | 2.5.8 Target Size (Minimum) | AA | serious | yes |
| text-contrast | 1.4.3 Contrast (Minimum) | AA | serious | yes |
| non-text-contrast | 1.4.11 Non-text Contrast | AA | serious | yes |
| form-error-association | 3.3.1 Error Identification | A | serious | yes |
| input-autocomplete | 1.3.5 Identify Input Purpose | AA | serious | yes |
| heading-order | 1.3.1 Info and Relationships | A | moderate | yes |
| landmarks-skip-link | 2.4.1 Bypass Blocks | A | serious | yes |
| focus-not-obscured | 2.4.11 Focus Not Obscured (Minimum) | AA | moderate | yes |
| dragging-alternative | 2.5.7 Dragging Movements | AA | serious | yes |
| no-positive-tabindex | 2.4.3 Focus Order | A | serious | yes |
| aria-valid | 4.1.2 Name, Role, Value | A | serious | yes |
| viewport-zoom | 1.4.4 Resize Text | AA | serious | yes |
| paste-blocked | 3.3.8 Accessible Authentication (Minimum) | AA | serious | yes |
| reduced-motion | 2.3.3, 2.2.2 | AAA / A | minor | yes |
| media-captions | 1.2.2 Captions (Prerecorded) | A | minor until automated | yes |
| status-messages | 4.1.3 Status Messages | AA | serious | yes |

Where a jsx-a11y rule already covers the idea, the reference says so. Tailwind, shadcn, and Next checks are our own rules. WCAG 4.1.1 Parsing is obsolete in 2.2 and is not used.

The a11ycn score starts at 100. Each critical finding subtracts 15, serious 8, moderate 3, and minor 1. The floor is 0.

## Example report

From the seeded demo ([full report](docs/demo/before.md)):

### A11Y-0001 clickable-non-interactive

- **WCAG:** 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A)
- **File:** `apps/demo/before/app/dashboard/page.tsx:8:7`
- **Who is affected:** Keyboard users cannot reach or operate this control.

```tsx
<span onClick={() => {}}>Clear filters</span>
```

```diff
-      <span onClick={() => {}}>Clear filters</span>
+      <button type="button" onClick={() => {}}>Clear filters</button>
```

Every report ends with: "Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader."

## CLI and CI

This repo's CI installs, lints, typechecks, tests, builds, and runs `a11ycn audit apps/demo/after --fail-on serious`.

JSON reports match [skills/a11ycn/assets/report-schema.json](skills/a11ycn/assets/report-schema.json). Check one with no extra dependencies:

```bash
node skills/a11ycn/scripts/validate-report.mjs docs/demo/before.json
```

`--format sarif` writes SARIF 2.1.0. `--format github` writes `::error` / `::warning` / `::notice` annotations.

Other repos can run the composite action:

```yaml
- uses: ZenenContreras/a11ycn@v1
  with:
    path: .
    fail-on: serious
    format: github
    lang: en
```

The action builds this repo and runs the CLI. It does not download a published npm package.

## Publish to npm

The `a11ycn` package is **not published**. It is ready for a later release:

- `packages/cli/package.json` has `bin`, `files`, `repository`, `publishConfig.access`, and `publishConfig.provenance`.
- Playwright is an optional peer dependency. axe-core is bundled as a dependency.
- `.github/workflows/release.yml` runs only when someone starts it by hand (`workflow_dispatch`). It uses Changesets and `NPM_CONFIG_PROVENANCE=true`.
- Add an `NPM_TOKEN` secret, then run the Release workflow. Do not expect a publish from merging to `main`.

## Repository layout

```text
a11ycn/
  action.yml                 composite GitHub Action
  i18n/                      en.ts and es.ts, plus how to add a locale
  skills/a11ycn/             SKILL.md, references, report schema, validator
  packages/cli/              the a11ycn npm package
  packages/eslint-plugin-a11ycn/
  apps/demo/before|after/    seeded Next.js app and the fixed copy
  fixtures/                  one bad and one good file per rule
  test/                      Vitest suites
  docs/demo/                 reports generated from the demo
  .github/workflows/         CI and the manual release workflow
```

Shared tooling: `eslint.config.js`, `.prettierrc.json`, `tsconfig.base.json`, and the scripts in the root `package.json` (`lint`, `format`, `typecheck`, `test`, `build`, `demo:before`, `demo:after`).

## Languages

English is the default. Spanish covers CLI text, report headings, manual checks, and every finding message.

```bash
pnpm a11ycn audit ./app --lang es
A11YCN_LANG=es pnpm a11ycn audit ./app
```

To add a language, see [i18n/README.md](i18n/README.md).

## What it does not do

Static checks miss a lot. You still have to use the keyboard, a screen reader, and real users. a11ycn is not an overlay widget. It does not certify WCAG conformance, and a score of 100 only means these rules found nothing.

## Design principles

- Confirm a finding in the file before reporting it. A button that already has `<span className="sr-only">` is not an error.
- Every finding includes a code fix.
- No API key. No telemetry.
- Prefer a native element over a role bolted onto a `div`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). A new rule needs an id, a WCAG 2.2 criterion, a bad fixture, a good fixture, and a test that the bad file matches exactly and the good file is clean.

Inspired by [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y), [axe-core](https://github.com/dequelabs/axe-core), [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill), [pbakaus/impeccable](https://github.com/pbakaus/impeccable), and [Nutlope/hallmark](https://github.com/Nutlope/hallmark).

## License

MIT. See [LICENSE](LICENSE).
