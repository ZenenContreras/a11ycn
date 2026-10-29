/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./culori.d.ts" />
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { formatHex, parse, wcagContrast } from "culori";
import { PALETTE, TEXT_SIZE_OR_ALIGN } from "./palette.js";

const cssCache = new Map<string, Map<string, string>>();

const COLOR_PREFIX = /^(text|bg|border|ring|fill|stroke)-/;
const LARGE_SIZE = /^text-(2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/;
const BOLD = new Set(["font-bold", "font-extrabold", "font-black"]);

export function loadCssVariables(filename: string): Map<string, string> {
  const start = path.dirname(path.resolve(filename));
  const cached = cssCache.get(start);
  if (cached) return cached;
  const variables = new Map<string, string>();
  let current = start;
  const root = path.parse(current).root;
  while (true) {
    for (const relative of ["globals.css", path.join("app", "globals.css"), path.join("src", "app", "globals.css")]) {
      const file = path.join(current, relative);
      if (!existsSync(file)) continue;
      readVariables(readFileSync(file, "utf8"), variables);
    }
    if (current === root) break;
    current = path.dirname(current);
  }
  cssCache.set(start, variables);
  return variables;
}

export function clearCssCache(): void {
  cssCache.clear();
}

export function isLargeText(tokens: string[]): boolean {
  if (tokens.some((token) => LARGE_SIZE.test(token))) return true;
  return tokens.includes("text-lg") && tokens.some((token) => BOLD.has(token));
}

export function colorTokens(tokens: string[], kind: "text" | "bg" | "border" | "ring"): string[] {
  return tokens.filter((token) => {
    if (token.includes(":") && !token.startsWith("[")) {
      const colon = token.indexOf(":");
      const arbitrary = token.indexOf("[");
      if (arbitrary === -1 || colon < arbitrary) return false;
    }
    if (!token.startsWith(`${kind}-`)) return false;
    const body = token.slice(kind.length + 1);
    if (kind === "text" && (TEXT_SIZE_OR_ALIGN.has(body) || body.startsWith("["))) {
      if (body.startsWith("[") && isArbitraryColor(body)) return true;
      return false;
    }
    return true;
  });
}

export function resolveColor(token: string, variables: Map<string, string>): string | null {
  const body = token.replace(COLOR_PREFIX, "");
  if (body.includes("/")) return null;
  if (body === "white") return "#ffffff";
  if (body === "black") return "#000000";
  if (body === "transparent" || body === "current" || body === "inherit") return null;
  if (body.startsWith("[") && body.endsWith("]")) {
    return toHex(body.slice(1, -1).replace(/_/g, " "));
  }
  const palette = body.match(/^([a-z]+)-(\d{2,3})$/);
  if (palette?.[1] && palette[2]) return PALETTE[palette[1]]?.[palette[2]] ?? null;
  const variable = variables.get(`--${body}`);
  if (!variable) return null;
  return cssValueToHex(variable);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const ratio = wcagContrast(foreground, background);
  return typeof ratio === "number" && Number.isFinite(ratio) ? ratio : null;
}

function isArbitraryColor(body: string): boolean {
  const inner = body.slice(1, -1);
  return inner.startsWith("#") || /^(?:hsl|rgb|oklch|lab|lch)\(/.test(inner);
}

function cssValueToHex(value: string): string | null {
  const trimmed = value.trim();
  const direct = toHex(trimmed);
  if (direct) return direct;
  if (/^[\d.]+(?:deg)?\s+[\d.]+%\s+[\d.]+%$/.test(trimmed)) return toHex(`hsl(${trimmed})`);
  return null;
}

function toHex(value: string): string | null {
  const parsed = parse(value);
  if (!parsed) return null;
  if (parsed.alpha != null && parsed.alpha < 1) return null;
  return formatHex(parsed) ?? null;
}

function readVariables(css: string, into: Map<string, string>): void {
  const root = css.match(/:root\s*\{([^}]*)\}/);
  if (!root?.[1]) return;
  for (const match of root[1].matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2]?.trim();
    if (name && value) into.set(name, value);
  }
}
