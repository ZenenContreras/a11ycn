# Changelog

## 0.2.0

- Contrast checks for Tailwind classes and shadcn CSS variables (`text-contrast`, `non-text-contrast`).
- The rest of the v0.1 rule list, including headings, landmarks, autocomplete, drag-and-drop, zoom, and paste.
- Optional browser audit with axe-core. Playwright is optional and the static scan continues without it.
- SARIF 2.1.0 and GitHub annotation output.
- `rules`, `badge`, and `init`.
- Composite GitHub Action and a manual provenance-ready release workflow. Nothing is published to npm.
- English and Spanish reports via `--lang`, `A11YCN_LANG`, or the system locale.

## 0.1.0

Phase 1 static auditor.

- Agent skill at `skills/a11ycn/SKILL.md`, with rules, shadcn fixes, manual checks, and the report format.
- `a11ycn audit` for `.ts`, `.tsx`, and `.jsx`, with JSON and Markdown reports.
- Rules: `img-alt`, `icon-button-name`, `clickable-non-interactive`, `focus-visible-removed`, `form-label`, `html-lang`, `page-title`, `link-name`, `dialog-title`, `target-size`.
- Seeded Next.js demo in `apps/demo/before` and the fixed tree in `apps/demo/after`.
