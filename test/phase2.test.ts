import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { messages as en } from "../i18n/en.js";
import { messages as es } from "../i18n/es.js";
import { audit } from "../packages/cli/src/audit.js";
import { isIgnored } from "../packages/cli/src/config.js";
import { normalizeLocale, resolveLocale, t } from "../packages/cli/src/i18n.js";
import { renderGithub } from "../packages/cli/src/report/github.js";
import { renderSarif } from "../packages/cli/src/report/sarif.js";
import { dedupeFindings, mapAxe } from "../packages/cli/src/scan/browser.js";
import { lintSource } from "../packages/cli/src/scan/static.js";
import { runCli } from "../packages/cli/src/index.js";

const root = path.resolve(import.meta.dirname, "..");

function ids(relativePath: string, rule: string) {
  const filename = path.join(root, relativePath);
  const source = readFileSync(filename, "utf8");
  return lintSource(source, filename, [rule]).findings.map((finding) => finding.messageId);
}

describe("phase 2 rules", () => {
  it("checks contrast from Tailwind classes and shadcn variables", () => {
    expect(ids("fixtures/text-contrast/bad.tsx", "text-contrast")).toEqual(["low"]);
    expect(ids("fixtures/text-contrast/good.tsx", "text-contrast")).toEqual([]);
    const vars = ids("fixtures/text-contrast/vars/app/page.tsx", "text-contrast");
    expect(vars).toContain("low");
    expect(vars.filter((id) => id === "low")).toHaveLength(1);
    expect(ids("fixtures/non-text-contrast/bad.tsx", "non-text-contrast")).toEqual(["low"]);
    expect(ids("fixtures/non-text-contrast/good.tsx", "non-text-contrast")).toEqual([]);
  });

  it("checks the remaining static rules", () => {
    expect(ids("fixtures/form-error-association/bad.tsx", "form-error-association")).toEqual(["missingAssociation"]);
    expect(ids("fixtures/form-error-association/good.tsx", "form-error-association")).toEqual([]);
    expect(ids("fixtures/input-autocomplete/bad.tsx", "input-autocomplete")).toEqual(["missingAutocomplete"]);
    expect(ids("fixtures/input-autocomplete/good.tsx", "input-autocomplete")).toEqual([]);
    expect(ids("fixtures/heading-order/bad/app/page.tsx", "heading-order").sort()).toEqual(["missingH1", "skipped"]);
    expect(ids("fixtures/heading-order/good/app/page.tsx", "heading-order")).toEqual([]);
    expect(ids("fixtures/landmarks-skip-link/bad/app/layout.tsx", "landmarks-skip-link")).toEqual(["missingSkip"]);
    expect(ids("fixtures/landmarks-skip-link/bad/app/page.tsx", "landmarks-skip-link")).toEqual(["missingMain"]);
    expect(ids("fixtures/landmarks-skip-link/good/app/layout.tsx", "landmarks-skip-link")).toEqual([]);
    expect(ids("fixtures/landmarks-skip-link/good/app/page.tsx", "landmarks-skip-link")).toEqual([]);
    expect(ids("fixtures/focus-not-obscured/bad.tsx", "focus-not-obscured")).toEqual(["obscured"]);
    expect(ids("fixtures/focus-not-obscured/good.tsx", "focus-not-obscured")).toEqual([]);
    expect(ids("fixtures/dragging-alternative/bad.tsx", "dragging-alternative")).toEqual(["noAlternative"]);
    expect(ids("fixtures/dragging-alternative/good.tsx", "dragging-alternative")).toEqual([]);
    expect(ids("fixtures/no-positive-tabindex/bad.tsx", "no-positive-tabindex")).toEqual(["positive"]);
    expect(ids("fixtures/no-positive-tabindex/good.tsx", "no-positive-tabindex")).toEqual([]);
    expect(ids("fixtures/aria-valid/bad.tsx", "aria-valid").sort()).toEqual(["badAria", "hiddenFocusable", "invalidRole"]);
    expect(ids("fixtures/aria-valid/good.tsx", "aria-valid")).toEqual([]);
    expect(ids("fixtures/viewport-zoom/bad.tsx", "viewport-zoom")).toEqual(["zoomBlocked"]);
    expect(ids("fixtures/viewport-zoom/good.tsx", "viewport-zoom")).toEqual([]);
    expect(ids("fixtures/paste-blocked/bad.tsx", "paste-blocked")).toEqual(["pasteBlocked"]);
    expect(ids("fixtures/paste-blocked/good.tsx", "paste-blocked")).toEqual([]);
    expect(ids("fixtures/reduced-motion/bad.tsx", "reduced-motion")).toEqual(["motion"]);
    expect(ids("fixtures/reduced-motion/good.tsx", "reduced-motion")).toEqual([]);
    expect(ids("fixtures/media-captions/bad.tsx", "media-captions")).toEqual(["missingCaptions"]);
    expect(ids("fixtures/media-captions/good.tsx", "media-captions")).toEqual([]);
    expect(ids("fixtures/status-messages/bad.tsx", "status-messages")).toEqual(["noLive"]);
    expect(ids("fixtures/status-messages/good.tsx", "status-messages")).toEqual([]);
  });
});

describe("i18n", () => {
  it("keeps Spanish aligned with English and resolves the locale", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    expect(t("es", "rules.img-alt.missingAlt.message")).toContain("alt");
    expect(t("es", "cli.failed", { severity: "serious" })).toContain("serious");
    expect(normalizeLocale("es_ES.UTF-8")).toBe("es");
    expect(resolveLocale({ flag: "es" }).locale).toBe("es");
    expect(resolveLocale({ env: { LANG: "es_MX.UTF-8" } }).locale).toBe("es");
    expect(resolveLocale({ flag: "fr" }).error).toBe("fr");
    expect(resolveLocale({ env: {} }).locale).toBe("en");
  });

  it("writes a Spanish report when --lang es is set", async () => {
    const result = await audit({
      path: "fixtures/img-alt/bad.tsx",
      failOn: "minor",
      cache: false,
      cwd: root,
      lang: "es",
    });
    expect(result.locale).toBe("es");
    expect(result.report.findings[0]?.message).toMatch(/imagen|alt/i);
    expect(result.report.manualChecks[0]?.notes).toMatch(/teclado/i);
  });
});

describe("browser, SARIF, and GitHub output", () => {
  it("maps axe results and drops duplicates", async () => {
    const mapped = mapAxe("http://localhost:3000", [
      {
        id: "image-alt",
        impact: "critical",
        help: "Images must have alternate text",
        description: "Screen reader users need a text alternative.",
        tags: ["wcag2a", "wcag111"],
        nodes: [{ html: "<img src='/hero.png'>" }],
      },
    ]);
    expect(mapped[0]?.ruleId).toBe("img-alt");
    expect(mapped[0]?.wcag[0]?.criterion).toBe("1.1.1");
    const kept = dedupeFindings(
      [{ ...mapped[0]!, file: "app/page.tsx", snippet: "<img src='/hero.png'>" }],
      mapped,
    );
    expect(kept).toHaveLength(1);

    const result = await audit({
      path: "fixtures/img-alt/good.tsx",
      failOn: "minor",
      cache: false,
      cwd: root,
      url: "http://localhost:3000",
      browserScan: async () => ({
        findings: mapped,
      }),
    });
    expect(result.report.findings.some((finding) => finding.source === "browser")).toBe(true);
    const sarif = JSON.parse(renderSarif(result.report)) as { version: string; runs: { results: unknown[] }[] };
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0]?.results.length).toBeGreaterThan(0);
    expect(renderGithub(result.report)).toContain("::error file=");
  });

  it("lists rules, writes a badge, and creates a config", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "a11ycn-init-"));
    const previous = process.cwd();
    process.chdir(directory);
    try {
      expect(await runCli(["node", "a11ycn", "init", "--lang", "es"])).toBe(0);
      expect(await runCli(["node", "a11ycn", "init"])).toBe(1);
      expect(await runCli(["node", "a11ycn", "rules", "--lang", "es"])).toBe(0);
    } finally {
      process.chdir(previous);
    }
    expect(isIgnored("src/generated/file.tsx", ["**/generated/**"])).toBe(true);
    expect(isIgnored("src/app/page.tsx", ["**/generated/**"])).toBe(false);
  });
});
