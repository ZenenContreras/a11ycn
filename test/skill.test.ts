import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RULE_IDS } from "eslint-plugin-a11ycn";

const skillDir = path.resolve(import.meta.dirname, "../skills/a11ycn");

describe("SKILL.md frontmatter", () => {
  const raw = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const frontmatter = parseFrontmatter(raw);

  it("matches the agentskills.io constraints", () => {
    expect(path.basename(skillDir)).toBe("a11ycn");
    expect(frontmatter.name).toBe("a11ycn");
    expect(frontmatter.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(frontmatter.name.length).toBeLessThanOrEqual(64);
    expect(frontmatter.description.length).toBeGreaterThan(0);
    expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
    expect(frontmatter.description.toLowerCase()).toContain("accessibility");
    expect(frontmatter.license).toBe("MIT");
    expect(frontmatter.compatibility.length).toBeGreaterThan(0);
    expect(frontmatter.compatibility.length).toBeLessThanOrEqual(500);
    expect(frontmatter.metadata.author).toBe("zenen");
    expect(frontmatter.metadata.version).toBe("0.2.0");
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
    expect(body.split("\n").length).toBeLessThan(500);
    expect(body.length / 4).toBeLessThan(5000);
  });

  it("points at one-level references and the automated rules", () => {
    for (const reference of ["rules.md", "shadcn-fixes.md", "manual-checks.md", "report-format.md"]) {
      expect(raw).toContain(`references/${reference}`);
      expect(statSync(path.join(skillDir, "references", reference)).isFile()).toBe(true);
    }
    expect(statSync(path.join(skillDir, "assets", "report-schema.json")).isFile()).toBe(true);
    expect(statSync(path.join(skillDir, "scripts", "validate-report.mjs")).isFile()).toBe(true);
    for (const ruleId of RULE_IDS) expect(raw.includes(ruleId) || readRules().includes(`# ${ruleId}`)).toBe(true);
    expect(readdirSync(path.join(skillDir, "references")).every((name) => !name.includes("/"))).toBe(true);
  });
});

function readRules(): string {
  return readFileSync(path.join(skillDir, "references", "rules.md"), "utf8");
}

function parseFrontmatter(markdown: string): {
  name: string;
  description: string;
  license: string;
  compatibility: string;
  metadata: Record<string, string>;
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match?.[1]) throw new Error("SKILL.md is missing frontmatter");
  const data: Record<string, string | Record<string, string>> = {};
  let currentMap: string | undefined;
  for (const line of match[1].split("\n")) {
    if (line.startsWith("  ")) {
      if (!currentMap) throw new Error(`Unexpected nested line: ${line}`);
      const nested = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!nested?.[1]) throw new Error(`Bad nested line: ${line}`);
      const map = data[currentMap];
      if (!map || typeof map === "string") throw new Error(`metadata is not a map`);
      map[nested[1]] = unquote(nested[2] ?? "");
      continue;
    }
    currentMap = undefined;
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field?.[1]) throw new Error(`Bad frontmatter line: ${line}`);
    if (field[2] === "") {
      data[field[1]] = {};
      currentMap = field[1];
    } else {
      data[field[1]] = unquote(field[2]);
    }
  }
  return {
    name: String(data.name),
    description: String(data.description),
    license: String(data.license),
    compatibility: String(data.compatibility),
    metadata: data.metadata as Record<string, string>,
  };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
