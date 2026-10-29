import { parse } from "@typescript-eslint/parser";
import {
  extractStaticTitle,
  getMessageMeta,
  getRule,
  isAppPage,
  isPagesRouterPage,
  type AnyNode,
} from "eslint-plugin-a11ycn";
import type { RawFinding } from "../types.js";

export function duplicateTitleFindings(files: readonly { file: string; source: string }[]): RawFinding[] {
  const pages: { file: string; title: string; line: number }[] = [];
  for (const file of files) {
    if (!isAppPage(file.file) && !isPagesRouterPage(file.file)) continue;
    const found = readTitle(file.source, file.file);
    if (!found) continue;
    pages.push({ file: file.file, ...found });
  }

  const groups = new Map<string, { file: string; title: string; line: number }[]>();
  for (const page of pages) {
    const key = page.title.trim();
    const group = groups.get(key) ?? [];
    group.push(page);
    groups.set(key, group);
  }

  const meta = getMessageMeta("page-title", "duplicateTitle");
  const rule = getRule("page-title");
  if (!meta || !rule) return [];

  const findings: RawFinding[] = [];
  for (const [title, group] of groups) {
    if (group.length < 2) continue;
    for (const page of group) {
      findings.push({
        ruleId: "page-title",
        messageId: "duplicateTitle",
        message: `Page title "${title}" is used by ${group.length} routes.`,
        file: page.file,
        line: page.line,
        column: 1,
        severity: meta.severity,
        status: meta.status,
        wcag: rule.wcag,
        whoIsAffected: meta.whoIsAffected,
        fixDescription: meta.fixDescription,
      });
    }
  }
  return findings;
}

function readTitle(source: string, filename: string): { title: string; line: number } | null {
  try {
    const ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      loc: true,
      range: true,
      jsx: true,
      filePath: filename,
    }) as unknown as AnyNode;
    return extractStaticTitle(ast);
  } catch {
    return null;
  }
}
