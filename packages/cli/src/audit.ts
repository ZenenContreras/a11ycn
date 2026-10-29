import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RULE_IDS } from "eslint-plugin-a11ycn";
import { buildFix } from "./fix.js";
import { MANUAL_CHECKS } from "./manual.js";
import { renderConsole } from "./report/console.js";
import { renderJson } from "./report/json.js";
import { renderMarkdown } from "./report/markdown.js";
import { failsThreshold, isSeverity, scoreFromFindings, SEVERITIES } from "./score.js";
import { emptyCache, fingerprint, loadCache, saveCache } from "./scan/cache.js";
import { createDisableMap } from "./scan/disable.js";
import { collectFiles, resolveTargets } from "./scan/files.js";
import { detectProject } from "./scan/project.js";
import { lintSource } from "./scan/static.js";
import { duplicateTitleFindings } from "./scan/titles.js";
import type { AuditOptions, AuditResult, Finding, Format, RawFinding, Report, Severity } from "./types.js";

const DOCS_ROOT = "https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md";

export async function audit(options: AuditOptions): Promise<AuditResult> {
  const cwd = options.cwd ?? process.cwd();
  const version = options.version ?? "0.1.0";
  const rules = normalizeRules(options.rules);
  const absoluteTargets = await resolveTargets(options.path, cwd);
  const files = await collectFiles(absoluteTargets);
  const project = await detectProject(absoluteTargets[0] ?? path.resolve(cwd, options.path));
  const warnings: string[] = [];
  if (options.url) {
    warnings.push(
      "Browser checks are not available in a11ycn 0.1.0. Continuing with the static scan.",
    );
  }

  const cacheDir = options.cache ? (options.cacheDir ?? path.join(cwd, ".a11ycn")) : undefined;
  const cache = cacheDir ? await loadCache(cacheDir) : emptyCache();
  let cacheHits = 0;
  let cacheDirty = false;
  const sources: { file: string; source: string }[] = [];
  const raw: RawFinding[] = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    sources.push({ file, source });
    const hash = fingerprint(source, rules, version);
    const cached = cache.entries[file];
    let findings: RawFinding[];
    if (options.cache && cached?.hash === hash) {
      findings = cached.findings;
      cacheHits += 1;
    } else {
      const linted = lintSource(source, file, rules);
      if (linted.error) warnings.push(`${toReportPath(file, cwd)}: ${linted.error}`);
      const disabled = createDisableMap(source);
      findings = linted.findings.filter((finding) => !disabled(finding.line, finding.ruleId));
      if (options.cache) {
        cache.entries[file] = { hash, findings };
        cacheDirty = true;
      }
    }
    raw.push(...findings);
  }

  if (rules.includes("page-title")) raw.push(...duplicateTitleFindings(sources));
  if (cacheDir && cacheDirty) {
    try {
      await saveCache(cacheDir, cache);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }

  const report = buildReport({
    raw,
    files,
    cwd,
    version,
    now: options.now ?? new Date(),
    targetPath: options.path,
    url: options.url ?? null,
    framework: project.framework,
    shadcn: project.shadcn,
    sources,
  });
  const exitCode = report.findings.some((finding) => failsThreshold(finding.severity, options.failOn))
    ? 2
    : 0;
  return { report, exitCode, warnings, cacheHits };
}

export async function writeReport(report: Report, format: Format, outFile: string): Promise<void> {
  const body = format === "json" ? renderJson(report) : renderMarkdown(report);
  await mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
  await writeFile(outFile, body, "utf8");
}

export function renderReport(report: Report, format: Format | "console"): string {
  if (format === "json") return renderJson(report);
  if (format === "md") return renderMarkdown(report);
  return renderConsole(report);
}

export function normalizeRules(rules: string[] | undefined): string[] {
  if (!rules || rules.length === 0) return [...RULE_IDS];
  const unknown = rules.filter((ruleId) => !RULE_IDS.includes(ruleId));
  if (unknown.length > 0) {
    throw new Error(`Unknown rule "${unknown.join(", ")}". Known rules: ${RULE_IDS.join(", ")}`);
  }
  return rules;
}

export function parseFailOn(value: string): Severity {
  if (!isSeverity(value)) {
    throw new Error(`Unknown severity "${value}". Use one of: ${SEVERITIES.join(", ")}`);
  }
  return value;
}

function buildReport(input: {
  raw: RawFinding[];
  files: string[];
  cwd: string;
  version: string;
  now: Date;
  targetPath: string;
  url: string | null;
  framework: Report["target"]["framework"];
  shadcn: boolean;
  sources: { file: string; source: string }[];
}): Report {
  const sourceByFile = new Map(input.sources.map((file) => [file.file, file.source]));
  const findings: Finding[] = input.raw.map((finding) => {
    const source = sourceByFile.get(finding.file) ?? "";
    const lineText = source.split(/\r?\n/)[finding.line - 1] ?? "";
    const file = toReportPath(finding.file, input.cwd);
    const fix = buildFix({
      file,
      line: finding.line,
      lineText,
      ruleId: finding.ruleId,
      messageId: finding.messageId,
    });
    return {
      id: "",
      ruleId: finding.ruleId,
      wcag: finding.wcag,
      severity: finding.severity,
      status: finding.status,
      source: "static",
      file,
      line: finding.line,
      column: finding.column,
      snippet: snippetOf(lineText),
      message: finding.message,
      whoIsAffected: finding.whoIsAffected,
      fix,
      docs: `${DOCS_ROOT}#${finding.ruleId}`,
    };
  });

  findings.sort(compareFindings);
  findings.forEach((finding, index) => {
    finding.id = `A11Y-${String(index + 1).padStart(4, "0")}`;
  });

  const summary = {
    score: scoreFromFindings(findings),
    critical: count(findings, "critical"),
    serious: count(findings, "serious"),
    moderate: count(findings, "moderate"),
    minor: count(findings, "minor"),
    filesScanned: input.files.length,
  };

  return {
    tool: "a11ycn",
    version: input.version,
    generatedAt: input.now.toISOString(),
    target: {
      path: input.targetPath.split(path.sep).join("/"),
      url: input.url,
      framework: input.framework,
      shadcn: input.shadcn,
    },
    summary,
    findings,
    manualChecks: MANUAL_CHECKS.map((check) => ({ ...check })),
  };
}

function compareFindings(a: Finding, b: Finding): number {
  const severity = SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
  if (severity !== 0) return severity;
  return (
    a.file.localeCompare(b.file) ||
    a.line - b.line ||
    a.column - b.column ||
    a.ruleId.localeCompare(b.ruleId) ||
    a.message.localeCompare(b.message)
  );
}

function count(findings: Finding[], severity: Severity): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

function snippetOf(line: string): string {
  const trimmed = line.trim().replace(/\s+/g, " ");
  return trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
}

export function toReportPath(file: string, cwd: string): string {
  const relative = path.relative(cwd, file);
  const chosen = relative.startsWith("..") || path.isAbsolute(relative) ? file : relative;
  return chosen.split(path.sep).join("/");
}
