import { getRule, type Severity, type WcagCriterion } from "eslint-plugin-a11ycn";
import type { RawFinding } from "../types.js";

const AXE_TO_RULE: Record<string, string> = {
  "image-alt": "img-alt",
  "button-name": "icon-button-name",
  "link-name": "link-name",
  label: "form-label",
  "html-has-lang": "html-lang",
  "document-title": "page-title",
  "color-contrast": "text-contrast",
  "target-size": "target-size",
  tabindex: "no-positive-tabindex",
  "aria-hidden-focus": "aria-valid",
  "meta-viewport": "viewport-zoom",
};

interface AxeNode {
  html?: string;
  target?: string[];
  failureSummary?: string;
}

interface AxeResult {
  id: string;
  impact?: string | null;
  help?: string;
  description?: string;
  tags?: string[];
  nodes?: AxeNode[];
}

export interface BrowserScan {
  findings: RawFinding[];
  warning?: string;
}

export async function scanBrowser(url: string): Promise<BrowserScan> {
  let playwright: { chromium: { launch: (options?: { headless?: boolean }) => Promise<BrowserLike> } };
  try {
    playwright = (await import("playwright")) as typeof playwright;
  } catch {
    return { findings: [], warning: "playwright-missing" };
  }
  let axeSource = "";
  try {
    const axe = (await import("axe-core")) as { source?: string; default?: { source?: string } };
    axeSource = axe.source ?? axe.default?.source ?? "";
  } catch {
    return { findings: [], warning: "axe-missing" };
  }
  if (!axeSource) return { findings: [], warning: "axe-missing" };

  try {
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.addScriptTag({ content: axeSource });
      const results = (await page.evaluate(async () => {
        const axeRuntime = (globalThis as { axe?: { run: () => Promise<{ violations?: AxeResult[]; incomplete?: AxeResult[] }> } }).axe;
        if (!axeRuntime) return { violations: [], incomplete: [] };
        return axeRuntime.run();
      })) as { violations?: AxeResult[]; incomplete?: AxeResult[] };
      return { findings: mapAxe(url, results.violations ?? [], results.incomplete ?? []) };
    } finally {
      await browser.close();
    }
  } catch {
    return { findings: [], warning: "playwright-missing" };
  }
}

interface BrowserLike {
  newPage: () => Promise<{
    goto: (url: string, options?: { waitUntil?: "domcontentloaded"; timeout?: number }) => Promise<unknown>;
    addScriptTag: (options: { content: string }) => Promise<unknown>;
    evaluate: <T>(fn: () => Promise<T> | T) => Promise<T>;
  }>;
  close: () => Promise<void>;
}

export function mapAxe(url: string, violations: AxeResult[], incomplete: AxeResult[] = []): RawFinding[] {
  const findings: RawFinding[] = [];
  for (const result of violations) findings.push(...nodesToFindings(url, result, "confirmed"));
  for (const result of incomplete) findings.push(...nodesToFindings(url, result, "needs_review"));
  return findings;
}

function nodesToFindings(url: string, result: AxeResult, status: "confirmed" | "needs_review"): RawFinding[] {
  const ruleId = AXE_TO_RULE[result.id] ?? `axe-${result.id}`;
  const rule = getRule(ruleId);
  const nodes = result.nodes?.length ? result.nodes : [{}];
  return nodes.map((node) => ({
    ruleId,
    messageId: "axe",
    message: result.help || result.description || result.id,
    file: url,
    line: 1,
    column: 1,
    severity: impactToSeverity(result.impact),
    status,
    wcag: wcagFromTags(result.tags ?? [], rule?.wcag),
    whoIsAffected: result.description || "People using assistive technology.",
    fixDescription: node.failureSummary || result.help || "Fix the issue reported by axe-core.",
    snippet: node.html ?? "",
  }));
}

function impactToSeverity(impact?: string | null): Severity {
  if (impact === "critical" || impact === "serious" || impact === "moderate" || impact === "minor") return impact;
  return "serious";
}

function wcagFromTags(tags: string[], fallback?: WcagCriterion[]): WcagCriterion[] {
  const level: WcagCriterion["level"] = tags.some((tag) => /aaa/i.test(tag))
    ? "AAA"
    : tags.some((tag) => /aa/i.test(tag))
      ? "AA"
      : "A";
  const criteria = tags.flatMap((tag) => {
    const match = tag.match(/^wcag(\d)(\d)(\d)$/);
    if (!match) return [];
    return [{ criterion: `${match[1]}.${match[2]}.${match[3]}`, name: fallback?.[0]?.name ?? "axe-core", level }];
  });
  if (criteria.length > 0) return criteria;
  return fallback ?? [{ criterion: "4.1.2", name: "Name, Role, Value", level: "A" }];
}

export function dedupeFindings(staticFindings: RawFinding[], browserFindings: RawFinding[]): RawFinding[] {
  const merged = [...staticFindings];
  for (const finding of browserFindings) {
    const duplicate = staticFindings.some((existing) => {
      if (existing.ruleId !== finding.ruleId) return false;
      if (existing.file === finding.file && existing.line === finding.line) return true;
      const snippet = existing.snippet?.replace(/\s+/g, "") ?? "";
      const html = (finding.snippet ?? "").replace(/\s+/g, "");
      return snippet.length > 12 && html.includes(snippet);
    });
    if (!duplicate) merged.push(finding);
  }
  return merged;
}
