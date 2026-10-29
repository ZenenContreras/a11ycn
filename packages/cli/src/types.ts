import type { FindingStatus, Severity, WcagCriterion } from "eslint-plugin-a11ycn";

export type { FindingStatus, Severity, WcagCriterion };

export type Format = "md" | "json" | "sarif" | "github";
export type Framework = "next-app-router" | "next-pages" | "vite-react" | "unknown";

export interface RawFinding {
  ruleId: string;
  messageId: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: Severity;
  status: FindingStatus;
  wcag: WcagCriterion[];
  whoIsAffected: string;
  fixDescription: string;
  snippet?: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  wcag: WcagCriterion[];
  severity: Severity;
  status: FindingStatus;
  source: "static" | "browser" | "manual";
  file: string;
  line: number;
  column: number;
  snippet: string;
  message: string;
  whoIsAffected: string;
  fix: {
    description: string;
    diff: string;
  };
  docs: string;
}

export interface ManualCheck {
  id: string;
  status: "todo" | "pass" | "fail";
  notes: string;
}

export interface Report {
  tool: "a11ycn";
  version: string;
  generatedAt: string;
  target: {
    path: string;
    url: string | null;
    framework: Framework;
    shadcn: boolean;
  };
  summary: {
    score: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    filesScanned: number;
  };
  findings: Finding[];
  manualChecks: ManualCheck[];
}

export interface AuditOptions {
  path: string;
  url?: string | null;
  format?: Format;
  out?: string;
  failOn: Severity;
  rules?: string[];
  cache: boolean;
  cacheDir?: string;
  cwd?: string;
  now?: Date;
  version?: string;
  lang?: string | null;
  failOnExplicit?: boolean;
  browserScan?: (url: string) => Promise<{ findings: RawFinding[]; warning?: string }>;
}

export interface AuditResult {
  report: Report;
  exitCode: 0 | 2;
  warnings: string[];
  cacheHits: number;
  locale: import("./i18n.js").Locale;
}
