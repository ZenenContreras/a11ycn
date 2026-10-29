import { t, type Locale } from "../i18n.js";
import { SEVERITIES } from "../score.js";
import type { Report } from "../types.js";

export function renderMarkdown(report: Report, locale: Locale = "en"): string {
  const lines: string[] = [];
  lines.push(`# ${t(locale, "report.title")}`);
  lines.push("");
  lines.push(`**${t(locale, "report.score")}** ${report.summary.score}/100`);
  lines.push("");
  lines.push(t(locale, "report.scanned", { count: String(report.summary.filesScanned), path: report.target.path }));
  lines.push(
    t(locale, "report.framework", {
      framework: report.target.framework,
      shadcn: report.target.shadcn ? t(locale, "report.shadcnYes") : t(locale, "report.shadcnNo"),
    }),
  );
  if (report.target.url) lines.push(t(locale, "report.url", { url: report.target.url }));
  lines.push("");
  lines.push(`| ${t(locale, "report.severityHeader")} | ${t(locale, "report.countHeader")} |`);
  lines.push("| --- | --- |");
  for (const severity of SEVERITIES) {
    lines.push(`| ${severity} | ${report.summary[severity]} |`);
  }
  lines.push("");

  for (const severity of SEVERITIES) {
    const group = report.findings.filter((finding) => finding.severity === severity);
    if (group.length === 0) continue;
    lines.push(`## ${t(locale, `severity.${severity}`)}`);
    lines.push("");
    for (const finding of group) {
      lines.push(`### ${finding.id} ${finding.ruleId}`);
      lines.push("");
      lines.push(`- **${t(locale, "report.wcag")}:** ${formatWcag(finding.wcag)}`);
      lines.push(`- **${t(locale, "report.file")}:** ${finding.file}:${finding.line}:${finding.column}`);
      lines.push(`- **${t(locale, "report.status")}:** ${finding.status}`);
      lines.push(`- **${t(locale, "report.source")}:** ${finding.source}`);
      lines.push(`- **${t(locale, "report.message")}:** ${finding.message}`);
      lines.push(`- **${t(locale, "report.who")}:** ${finding.whoIsAffected}`);
      lines.push("");
      lines.push("```tsx");
      lines.push(finding.snippet);
      lines.push("```");
      lines.push("");
      lines.push(`**${t(locale, "report.fix")}:** ${finding.fix.description}`);
      lines.push("");
      lines.push("```diff");
      lines.push(finding.fix.diff);
      lines.push("```");
      lines.push("");
      lines.push(`Docs: ${finding.docs}`);
      lines.push("");
    }
  }

  lines.push(`## ${t(locale, "report.manualTitle")}`);
  lines.push("");
  lines.push(t(locale, "report.manualIntro"));
  lines.push("");
  lines.push(`| ${t(locale, "report.check")} | ${t(locale, "report.status")} | ${t(locale, "report.notes")} |`);
  lines.push("| --- | --- | --- |");
  for (const check of report.manualChecks) {
    lines.push(`| ${check.id} | ${check.status} | ${check.notes} |`);
  }
  lines.push("");
  lines.push(t(locale, "report.disclaimer"));
  lines.push("");
  return lines.join("\n");
}

function formatWcag(wcag: Report["findings"][number]["wcag"]): string {
  return wcag.map((item) => `${item.criterion} ${item.name} (${item.level})`).join("; ");
}
