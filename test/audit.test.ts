import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { audit } from "../packages/cli/src/audit.js";
import { renderMarkdown } from "../packages/cli/src/report/markdown.js";
import { scoreFromFindings } from "../packages/cli/src/score.js";
import { isDisabled } from "../packages/cli/src/scan/disable.js";
import { validateReport } from "../skills/a11ycn/scripts/validate-report.mjs";

const root = path.resolve(import.meta.dirname, "..");

describe("audit", () => {
  it("finds every seeded issue in the before demo and none in the after demo", async () => {
    const before = await audit({
      path: "apps/demo/before",
      failOn: "serious",
      cache: false,
      cwd: root,
      now: new Date("2026-10-28T12:00:00.000Z"),
    });
    const counts = countByRule(before.report.findings.map((finding) => finding.ruleId));
    expect(counts["img-alt"]).toBe(3);
    expect(counts["icon-button-name"]).toBe(2);
    expect(counts["form-label"]).toBe(4);
    expect(counts["text-contrast"]).toBeGreaterThanOrEqual(1);
    expect(counts["input-autocomplete"]).toBeGreaterThanOrEqual(1);
    expect(counts["landmarks-skip-link"]).toBeGreaterThanOrEqual(1);
    expect(counts["heading-order"]).toBeGreaterThanOrEqual(1);
    expect(counts["focus-not-obscured"]).toBeGreaterThanOrEqual(1);
    expect(before.report.summary.filesScanned).toBe(7);
    expect(before.report.findings.length).toBeGreaterThanOrEqual(15);
    expect(before.report.target).toMatchObject({
      framework: "next-app-router",
      shadcn: true,
      url: null,
    });
    expect(before.exitCode).toBe(2);
    expect(before.report.summary.critical).toBeGreaterThan(0);
    expect(before.report.summary.score).toBe(scoreFromFindings(before.report.findings));
    expect(validateReport(before.report)).toEqual([]);

    const after = await audit({
      path: "apps/demo/after",
      failOn: "serious",
      cache: false,
      cwd: root,
      now: new Date("2026-10-28T12:00:00.000Z"),
    });
    expect(after.report.summary.critical).toBe(0);
    expect(after.report.summary.serious).toBe(0);
    expect(after.report.findings).toEqual([]);
    expect(after.report.summary.score).toBe(100);
    expect(after.exitCode).toBe(0);
    expect(validateReport(after.report)).toEqual([]);
  });

  it("writes a markdown report with the manual-check reminder", async () => {
    const result = await audit({
      path: "fixtures/icon-button-name/bad.tsx",
      failOn: "minor",
      cache: false,
      cwd: root,
      now: new Date("2026-10-28T12:00:00.000Z"),
      version: "0.1.0",
    });
    const markdown = renderMarkdown(result.report);
    expect(markdown).toContain("**a11ycn score:**");
    expect(markdown).toContain("### A11Y-0001 icon-button-name");
    expect(markdown).toContain("```diff");
    expect(markdown).toContain("focus-trap-dialog");
    expect(markdown).toContain(
      "Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.",
    );
    expect(result.report.findings[0]?.docs).toBe(
      "https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#icon-button-name",
    );
    expect(result.report.generatedAt).toBe("2026-10-28T12:00:00.000Z");
  });

  it("honors disable comments and the file hash cache", async () => {
    expect(
      isDisabled("const x = 1;\n// a11ycn-disable-next-line img-alt\n<img src='/a.png' />", 3, "img-alt"),
    ).toBe(true);
    expect(isDisabled("/* a11ycn-disable form-label */\n<input />", 2, "form-label")).toBe(true);
    expect(isDisabled("// a11ycn-disable-next-line img-alt\n<img />", 2, "form-label")).toBe(false);

    const directory = mkdtempSync(path.join(tmpdir(), "a11ycn-"));
    const file = path.join(directory, "widget.tsx");
    writeFileSync(file, "export function Widget() {\n  return <img src='/a.png' />;\n}\n");
    const cacheDir = path.join(directory, ".a11ycn");
    const first = await audit({
      path: file,
      failOn: "minor",
      cache: true,
      cacheDir,
      cwd: directory,
    });
    expect(first.cacheHits).toBe(0);
    expect(first.report.findings).toHaveLength(1);
    const cachedSource = readFileSync(path.join(cacheDir, "cache.json"), "utf8");
    expect(cachedSource).toContain("img-alt");
    const second = await audit({
      path: file,
      failOn: "minor",
      cache: true,
      cacheDir,
      cwd: directory,
    });
    expect(second.cacheHits).toBe(1);
    expect(second.report.findings).toHaveLength(1);

    writeFileSync(
      file,
      "export function Widget() {\n  // a11ycn-disable-next-line img-alt\n  return <img src='/a.png' />;\n}\n",
    );
    const third = await audit({
      path: file,
      failOn: "minor",
      cache: true,
      cacheDir,
      cwd: directory,
    });
    expect(third.report.findings).toEqual([]);
  });

  it("filters rules and floors the score at zero", async () => {
    const only = await audit({
      path: "apps/demo/before",
      failOn: "critical",
      rules: ["html-lang"],
      cache: false,
      cwd: root,
    });
    expect(only.report.findings.every((finding) => finding.ruleId === "html-lang")).toBe(true);
    expect(only.exitCode).toBe(0);
    expect(scoreFromFindings(Array.from({ length: 20 }, () => ({ severity: "critical" as const })))).toBe(0);
    await expect(
      audit({ path: "apps/demo/before", failOn: "serious", rules: ["not-a-rule"], cache: false, cwd: root }),
    ).rejects.toThrow(/Unknown rule/);
    await expect(
      audit({ path: "apps/demo/missing", failOn: "serious", cache: false, cwd: root }),
    ).rejects.toThrow(/Path not found/);
  });
});

function countByRule(ruleIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ruleId of ruleIds) counts[ruleId] = (counts[ruleId] ?? 0) + 1;
  return counts;
}
