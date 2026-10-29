import type { Severity } from "eslint-plugin-a11ycn";

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  moderate: 3,
  minor: 1,
};

export const SEVERITY_RANK: Record<Severity, number> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

export const SEVERITIES: readonly Severity[] = ["critical", "serious", "moderate", "minor"];

export function scoreFromFindings(findings: readonly { severity: Severity }[]): number {
  const penalty = findings.reduce((total, finding) => total + SEVERITY_WEIGHTS[finding.severity], 0);
  return Math.max(0, 100 - penalty);
}

export function failsThreshold(severity: Severity, failOn: Severity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[failOn];
}

export function isSeverity(value: string): value is Severity {
  return (SEVERITIES as readonly string[]).includes(value);
}
