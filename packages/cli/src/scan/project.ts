import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Framework } from "../types.js";

export interface ProjectInfo {
  root: string;
  framework: Framework;
  shadcn: boolean;
}

export async function detectProject(targetPath: string): Promise<ProjectInfo> {
  const startInfo = await stat(targetPath).catch(() => null);
  const start = !startInfo || startInfo.isDirectory() ? path.resolve(targetPath) : path.dirname(path.resolve(targetPath));
  const root = (await findUp(start, "package.json")) ?? start;
  const pkg = await readPackage(path.join(root, "package.json"));
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };
  const hasNext = Boolean(deps.next);
  const hasVite = Boolean(deps.vite);
  const hasReact = Boolean(deps.react);
  const appDir = (await exists(path.join(root, "app"))) || (await exists(path.join(root, "src", "app")));
  const pagesDir = (await exists(path.join(root, "pages"))) || (await exists(path.join(root, "src", "pages")));
  let framework: Framework = "unknown";
  if (hasNext && appDir) framework = "next-app-router";
  else if (hasNext && pagesDir) framework = "next-pages";
  else if (hasVite && hasReact) framework = "vite-react";
  const shadcn = await exists(path.join(root, "components.json"));
  return { root, framework, shadcn };
}

async function readPackage(file: string): Promise<{
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
  } catch {
    return {};
  }
}

async function findUp(start: string, filename: string): Promise<string | null> {
  let current = path.resolve(start);
  const root = path.parse(current).root;
  while (true) {
    if (await exists(path.join(current, filename))) return current;
    if (current === root) return null;
    current = path.dirname(current);
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
