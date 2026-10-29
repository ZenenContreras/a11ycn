# Report format

Write both files after an audit:

- `.a11ycn/report.json` validates against [../assets/report-schema.json](../assets/report-schema.json).
- `.a11ycn/REPORT.md` is the version a person reads.

Check the JSON with no extra dependencies:

```bash
node skills/a11ycn/scripts/validate-report.mjs .a11ycn/report.json
```

## JSON

`tool` is `a11ycn`. `version` is the CLI version. `generatedAt` is ISO-8601.

`target.framework` is `next-app-router`, `next-pages`, `vite-react`, or `unknown`. `target.shadcn` is true when `components.json` is present. `target.url` is null when no URL was passed.

`summary.score` is the a11ycn score from 0 to 100. It starts at 100 and subtracts 15 for each critical finding, 8 for serious, 3 for moderate, and 1 for minor. It does not go below 0. It is not an official accessibility score. The severity counts must match `findings`.

Each finding has `id` (`A11Y-0001`), `ruleId`, `wcag`, `severity`, `status` (`confirmed` or `needs_review`), `source` (`static`, `browser`, or `manual`), location, `snippet`, `message`, `whoIsAffected`, `fix.description`, `fix.diff`, and `docs`.

`manualChecks` entries stay `todo` until a person does the check in [manual-checks.md](manual-checks.md).

## Markdown

Start with the a11ycn score and the severity counts. Group findings by severity. Each finding shows the snippet and the diff. End with the manual checks and this sentence:

> Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.

## Exit codes

`0` when no finding is at or above `--fail-on` (default `serious`). `2` when one is. `1` when the scan itself fails, for example because the path does not exist.
