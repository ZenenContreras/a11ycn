# Contributing

a11ycn is an early static checker. Issues and rules that are wrong in real code are welcome.

## A new rule

Open a "New rule" issue, or send a pull request with:

1. A kebab-case id and a WCAG 2.2 criterion and level. Do not use 4.1.1 Parsing.
2. Severity: critical, serious, moderate, or minor. Minor rules must not fail `--fail-on serious`.
3. A short explanation of who is affected (screen reader, keyboard, low vision, or motor).
4. `fixtures/<id>/bad.tsx` and `fixtures/<id>/good.tsx`.
5. A Vitest case that expects the exact findings on the bad file and zero findings on the good file.
6. A section in `skills/a11ycn/references/rules.md`, and a shadcn-specific fix in `references/shadcn-fixes.md` when the component is from that kit.

If `eslint-plugin-jsx-a11y` already checks the same thing, say so in the rule docs and extend it only for Tailwind, shadcn, or Next.

## False positives

Open a "False positive" issue with the file snippet and the rule id. The ignore comments are:

```tsx
// a11ycn-disable-next-line icon-button-name
<button type="button">
  <Menu />
</button>
```

```tsx
/* a11ycn-disable form-label */
```

The block comment disables that rule from that line to the end of the file.

## Development

Node.js 20 or newer and pnpm 10.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm a11ycn audit apps/demo/after --fail-on serious
```

Packages are TypeScript, ESM, built with tsup, and tested with Vitest. Coverage for `packages/` is at least 80%. Changesets is configured for later publishes. Do not publish to npm from a pull request.
