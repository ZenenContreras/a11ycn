import type { Report } from "../types.js";

const LEVEL: Record<Report["findings"][number]["severity"], string> = {
  critical: "error",
  serious: "error",
  moderate: "warning",
  minor: "note",
};

export function renderSarif(report: Report): string {
  const rules = [...new Map(report.findings.map((finding) => [finding.ruleId, finding])).values()];
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "a11ycn",
            version: report.version,
            informationUri: "https://github.com/ZenenContreras/a11ycn",
            rules: rules.map((finding) => ({
              id: finding.ruleId,
              shortDescription: { text: finding.message },
              helpUri: finding.docs,
              properties: {
                tags: finding.wcag.map((item) => `WCAG ${item.criterion}`),
              },
            })),
          },
        },
        results: report.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: LEVEL[finding.severity],
          message: { text: `${finding.message} ${finding.whoIsAffected}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file },
                region: { startLine: finding.line, startColumn: finding.column },
              },
            },
          ],
        })),
      },
    ],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
}
