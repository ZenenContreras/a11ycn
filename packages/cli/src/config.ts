import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Severity } from "./types.js";

export interface A11yConfig {
  paths?: string[];
  ignore?: string[];
  failOn?: Severity;
  rules?: string[];
  lang?: string;
}

export const CONFIG_FILENAME = "a11ycn.config.json";

export async function loadConfig(cwd: string): Promise<A11yConfig> {
  try {
    const parsed = JSON.parse(await readFile(path.join(cwd, CONFIG_FILENAME), "utf8")) as A11yConfig;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function configTemplate(): string {
  return `${JSON.stringify(
    {
      paths: ["src", "app"],
      ignore: [],
      failOn: "serious",
      rules: [],
      lang: "en",
    },
    null,
    2,
  )}\n`;
}

export async function writeConfig(cwd: string, force: boolean): Promise<{ file: string; created: boolean }> {
  const file = path.join(cwd, CONFIG_FILENAME);
  if (!force) {
    try {
      await readFile(file, "utf8");
      return { file, created: false };
    } catch {
      // The file is missing, so we can create it.
    }
  }
  await writeFile(file, configTemplate(), "utf8");
  return { file, created: true };
}

export function isIgnored(file: string, patterns: string[]): boolean {
  const normalized = file.split(path.sep).join("/");
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split(path.sep)
    .join("/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`(?:^|/)${escaped}$`);
}
