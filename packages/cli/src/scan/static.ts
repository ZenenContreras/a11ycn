import path from "node:path";
import tsParser from "@typescript-eslint/parser";
import { Linter } from "eslint";
import plugin, { RULE_IDS, getMessageMeta, getRule } from "eslint-plugin-a11ycn";
import type { RawFinding } from "../types.js";

export interface LintFileResult {
  findings: RawFinding[];
  error?: string;
}

let linter: Linter | undefined;

export function lintSource(
  source: string,
  filename: string,
  enabled: readonly string[] = RULE_IDS,
): LintFileResult {
  const absolute = path.resolve(filename);
  const rules: Record<string, "error"> = {};
  for (const ruleId of enabled) rules[`a11ycn/${ruleId}`] = "error";
  const engine = (linter ??= new Linter({
    configType: "flat",
    cwd: path.parse(absolute).root,
  }));
  try {
    const messages = engine.verify(
      source,
      [
        {
          files: ["**/*.{ts,tsx,jsx}"],
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              ecmaVersion: "latest",
              sourceType: "module",
              ecmaFeatures: { jsx: true },
            },
          },
          plugins: { a11ycn: plugin },
          rules,
        },
      ],
      { filename: absolute },
    );
    const findings: RawFinding[] = [];
    for (const message of messages) {
      if (!message.ruleId || message.fatal) continue;
      const ruleId = message.ruleId.replace(/^a11ycn\//, "");
      const messageId = message.messageId;
      if (!messageId) continue;
      const meta = getMessageMeta(ruleId, messageId);
      if (!meta) continue;
      findings.push({
        ruleId,
        messageId,
        message: message.message,
        file: absolute,
        line: message.line,
        column: message.column,
        severity: meta.severity,
        status: meta.status,
        wcag: getRule(ruleId)?.wcag ?? [],
        whoIsAffected: meta.whoIsAffected,
        fixDescription: meta.fixDescription,
      });
    }
    return { findings };
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    return {
      findings: [],
      error: message,
    };
  }
}
