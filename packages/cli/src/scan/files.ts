import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".jsx"]);
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".git",
  ".a11ycn",
  "out",
]);

export async function resolveTargets(input: string, cwd = process.cwd()): Promise<string[]> {
  if (input !== ".") return [path.resolve(cwd, input)];
  const preferred: string[] = [];
  for (const directory of ["src", "app"]) {
    const fullPath = path.join(cwd, directory);
    try {
      const info = await stat(fullPath);
      if (info.isDirectory()) preferred.push(fullPath);
    } catch {
      // Missing default directories fall through to the project root.
    }
  }
  return preferred.length > 0 ? preferred : [path.resolve(cwd)];
}

export async function collectFiles(targets: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const target of targets) {
    let info;
    try {
      info = await stat(target);
    } catch {
      throw new Error(`Path not found: ${target}`);
    }
    if (info.isFile()) {
      if (isSourceFile(target)) files.push(path.resolve(target));
      continue;
    }
    if (!info.isDirectory()) continue;
    await walk(path.resolve(target), files);
  }
  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

async function walk(directory: string, files: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      await walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && isSourceFile(entry.name)) files.push(fullPath);
  }
}

function isSourceFile(file: string): boolean {
  if (file.endsWith(".d.ts")) return false;
  return SOURCE_EXTENSIONS.has(path.extname(file));
}
