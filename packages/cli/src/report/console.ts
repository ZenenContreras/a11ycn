import pc from "picocolors";
import { t, type Locale } from "../i18n.js";
import { SEVERITIES } from "../score.js";
import type { Report, Severity } from "../types.js";

const PAINT: Record<Severity, (value: string) => string> = {
  critical: pc.red,
  serious: pc.yellow,
  moderate: pc.magenta,
  minor: pc.dim,
};

export function renderConsole(report: Report, locale: Locale = "en"): string {
  const lines: string[] = [];
  lines.push(`${pc.bold("a11ycn")} ${pc.dim(report.version)}`);
  const stack = [
    report.target.path,
    report.target.framework,
    report.target.shadcn ? "shadcn" : "no shadcn",
  ];
  lines.push(pc.dim(stack.join(" · ")));
  lines.push(`${pc.bold(t(locale, "cli.score"))} ${colorScore(report.summary.score)}`);
  lines.push(pc.dim(t(locale, "cli.filesScanned", { count: String(report.summary.filesScanned) })));
  lines.push("");

  if (report.findings.length === 0) {
    lines.push(pc.green(t(locale, "cli.noFindings")));
  } else {
    for (const severity of SEVERITIES) {
      const group = report.findings.filter((finding) => finding.severity === severity);
      if (group.length === 0) continue;
      lines.push(PAINT[severity](`${t(locale, `severity.${severity}`)} (${group.length})`));
      for (const finding of group) {
        const location = pc.underline(`${finding.file}:${finding.line}:${finding.column}`);
        lines.push(`  ${location}  ${pc.bold(finding.ruleId)}  ${finding.message}`);
      }
      lines.push("");
    }
  }

  lines.push(pc.dim(t(locale, "report.disclaimer")));
  return lines.join("\n");
}

function colorScore(score: number): string {
  if (score >= 90) return pc.green(`${score}/100`);
  if (score >= 70) return pc.yellow(`${score}/100`);
  return pc.red(`${score}/100`);
}
