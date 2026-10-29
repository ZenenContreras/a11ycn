# a11ycn report

**a11ycn score:** {{score}}/100

Scanned {{filesScanned}} files in `{{path}}`.

| Severity | Count |
| --- | --- |
| critical | {{critical}} |
| serious | {{serious}} |
| moderate | {{moderate}} |
| minor | {{minor}} |

## {{Severity}}

### {{id}} {{ruleId}}

- **WCAG:** {{criterion}} {{name}} ({{level}})
- **File:** {{file}}:{{line}}:{{column}}
- **Status:** {{status}}
- **Message:** {{message}}
- **Who is affected:** {{whoIsAffected}}

```tsx
{{snippet}}
```

**Fix:** {{fix.description}}

```diff
{{fix.diff}}
```

## Manual checks

| Check | Status | Notes |
| --- | --- | --- |
| {{id}} | {{status}} | {{notes}} |

Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.
