import type { Report, Severity } from "../types.js";
import { SEVERITIES } from "../score.js";

const HEADINGS: Record<Severity, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
};

export function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push("# a11ycn report");
  lines.push("");
  lines.push(`**a11ycn score:** ${report.summary.score}/100`);
  lines.push("");
  lines.push(`Scanned ${report.summary.filesScanned} files in \`${report.target.path}\`.`);
  lines.push(`Framework: ${report.target.framework}. shadcn/ui: ${report.target.shadcn ? "yes" : "no"}.`);
  if (report.target.url) lines.push(`URL: ${report.target.url}`);
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("| --- | --- |");
  for (const severity of SEVERITIES) {
    lines.push(`| ${severity} | ${report.summary[severity]} |`);
  }
  lines.push("");

  for (const severity of SEVERITIES) {
    const group = report.findings.filter((finding) => finding.severity === severity);
    if (group.length === 0) continue;
    lines.push(`## ${HEADINGS[severity]}`);
    lines.push("");
    for (const finding of group) {
      lines.push(`### ${finding.id} ${finding.ruleId}`);
      lines.push("");
      lines.push(`- **WCAG:** ${formatWcag(finding.wcag)}`);
      lines.push(`- **File:** ${finding.file}:${finding.line}:${finding.column}`);
      lines.push(`- **Status:** ${finding.status}`);
      lines.push(`- **Source:** ${finding.source}`);
      lines.push(`- **Message:** ${finding.message}`);
      lines.push(`- **Who is affected:** ${finding.whoIsAffected}`);
      lines.push("");
      lines.push("```tsx");
      lines.push(finding.snippet);
      lines.push("```");
      lines.push("");
      lines.push(`**Fix:** ${finding.fix.description}`);
      lines.push("");
      lines.push("```diff");
      lines.push(finding.fix.diff);
      lines.push("```");
      lines.push("");
      lines.push(`Docs: ${finding.docs}`);
      lines.push("");
    }
  }

  lines.push("## Manual checks");
  lines.push("");
  lines.push("These are not decided by the static scan. Leave them as `todo` until a person checks them.");
  lines.push("");
  lines.push("| Check | Status | Notes |");
  lines.push("| --- | --- | --- |");
  for (const check of report.manualChecks) {
    lines.push(`| ${check.id} | ${check.status} | ${check.notes} |`);
  }
  lines.push("");
  lines.push(
    "Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.",
  );
  lines.push("");
  return lines.join("\n");
}

function formatWcag(wcag: Report["findings"][number]["wcag"]): string {
  return wcag.map((item) => `${item.criterion} ${item.name} (${item.level})`).join("; ");
}
