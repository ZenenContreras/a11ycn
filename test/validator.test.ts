import { describe, expect, it } from "vitest";
import { validateReport } from "../skills/a11ycn/scripts/validate-report.mjs";

describe("validate-report", () => {
  it("rejects a report that does not match the schema", () => {
    const errors = validateReport({
      tool: "other",
      version: "",
      generatedAt: "yesterday",
      target: { path: "", url: 1, framework: "vue", shadcn: "yes" },
      summary: { score: 101, critical: 1, serious: 0, moderate: 0, minor: 0, filesScanned: 0 },
      findings: [
        {
          id: "bad",
          ruleId: "Bad Rule",
          wcag: [],
          severity: "low",
          status: "maybe",
          source: "guess",
          file: "",
          line: 0,
          column: 0,
          fix: {},
        },
      ],
      manualChecks: [{ id: "", status: "later", notes: 1 }],
    });
    expect(errors.length).toBeGreaterThan(5);
    expect(validateReport(null)).toEqual(["Report must be an object."]);
  });
});
