import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RawFinding } from "../types.js";

interface CacheData {
  version: 1;
  entries: Record<string, { hash: string; findings: RawFinding[] }>;
}

export function fingerprint(source: string, rules: readonly string[], version: string): string {
  return createHash("sha256")
    .update(version)
    .update("\0")
    .update([...rules].sort().join(","))
    .update("\0")
    .update(source)
    .digest("hex");
}

export async function loadCache(dir: string): Promise<CacheData> {
  try {
    const parsed = JSON.parse(await readFile(path.join(dir, "cache.json"), "utf8")) as CacheData;
    if (parsed.version !== 1 || !parsed.entries) return emptyCache();
    return parsed;
  } catch {
    return emptyCache();
  }
}

export async function saveCache(dir: string, cache: CacheData): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "cache.json"), JSON.stringify(cache), "utf8");
}

export function emptyCache(): CacheData {
  return { version: 1, entries: {} };
}

export type FileCache = CacheData;
