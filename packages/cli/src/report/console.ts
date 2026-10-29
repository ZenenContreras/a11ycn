import pc from "picocolors";
import type { Report, Severity } from "../types.js";
import { SEVERITIES } from "../score.js";

const PAINT: Record<Severity, (value: string) => string> = {
  critical: pc.red,
  serious: pc.yellow,
  moderate: pc.magenta,
  minor: pc.dim,
};

export function renderConsole(report: Report): string {
  const lines: string[] = [];
  lines.push(`${pc.bold("a11ycn")} ${pc.dim(report.version)}`);
  const stack = [
    report.target.path,
    report.target.framework,
    report.target.shadcn ? "shadcn" : "no shadcn",
  ];
  lines.push(pc.dim(stack.join(" · ")));
  lines.push(`${pc.bold("a11ycn score:")} ${colorScore(report.summary.score)}`);
  lines.push(pc.dim(`${report.summary.filesScanned} files scanned`));
  lines.push("");

  if (report.findings.length === 0) {
    lines.push(pc.green("No static findings."));
  } else {
    for (const severity of SEVERITIES) {
      const group = report.findings.filter((finding) => finding.severity === severity);
      if (group.length === 0) continue;
      lines.push(PAINT[severity](`${severity} (${group.length})`));
      for (const finding of group) {
        const location = pc.underline(`${finding.file}:${finding.line}:${finding.column}`);
        lines.push(`  ${location}  ${pc.bold(finding.ruleId)}  ${finding.message}`);
      }
      lines.push("");
    }
  }

  lines.push(
    pc.dim(
      "Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.",
    ),
  );
  return lines.join("\n");
}

function colorScore(score: number): string {
  if (score >= 90) return pc.green(`${score}/100`);
  if (score >= 70) return pc.yellow(`${score}/100`);
  return pc.red(`${score}/100`);
}
