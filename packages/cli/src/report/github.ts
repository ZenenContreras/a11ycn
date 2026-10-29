import type { Report } from "../types.js";

const COMMAND: Record<Report["findings"][number]["severity"], string> = {
  critical: "error",
  serious: "error",
  moderate: "warning",
  minor: "notice",
};

export function renderGithub(report: Report): string {
  const lines = report.findings.map((finding) => {
    const command = COMMAND[finding.severity];
    const message = finding.message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    return `::${command} file=${finding.file},line=${finding.line},col=${finding.column}::${finding.ruleId}: ${message}`;
  });
  lines.push(`::notice::a11ycn score ${report.summary.score}/100`);
  return `${lines.join("\n")}\n`;
}
