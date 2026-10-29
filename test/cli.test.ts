import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../packages/cli/src/index.js";

const root = path.resolve(import.meta.dirname, "..");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CLI", () => {
  it("prints JSON and returns 2 when findings meet the threshold", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const code = await runCli([
      "node",
      "a11ycn",
      "audit",
      "fixtures/html-lang/bad/app/layout.tsx",
      "--format",
      "json",
      "--fail-on",
      "serious",
      "--no-cache",
    ]);
    expect(code).toBe(2);
    const payload = JSON.parse(String(stdout.mock.calls[0]?.[0]));
    expect(payload.tool).toBe("a11ycn");
    expect(payload.findings.some((finding: { ruleId: string }) => finding.ruleId === "html-lang")).toBe(true);
    expect(error.mock.calls.some((call) => String(call[0]).includes("Failed"))).toBe(true);
    expect(log).not.toHaveBeenCalled();
  });

  it("writes a markdown file for a clean scan", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "a11ycn-out-"));
    const out = path.join(directory, "report.md");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const previous = process.cwd();
    process.chdir(root);
    try {
      const code = await runCli([
        "node",
        "a11ycn",
        "audit",
        "fixtures/img-alt/good.tsx",
        "--out",
        out,
        "--no-cache",
      ]);
      expect(code).toBe(0);
    } finally {
      process.chdir(previous);
    }
    const markdown = readFileSync(out, "utf8");
    expect(markdown).toContain("a11ycn score:** 100/100");
    expect(markdown).toContain("Test with a keyboard and a screen reader.");
  });

  it("warns that browser checks are not available and rejects a bad format", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const code = await runCli([
      "node",
      "a11ycn",
      "audit",
      "fixtures/page-title/good/app/page.tsx",
      "--url",
      "http://localhost:3000",
      "--format",
      "json",
      "--no-cache",
    ]);
    expect(code).toBe(0);
    expect(error.mock.calls.some((call) => String(call[0]).includes("Browser checks are not available"))).toBe(
      true,
    );
    const invalid = await runCli(["node", "a11ycn", "audit", ".", "--format", "sarif"]);
    expect(invalid).toBe(1);
  });
});
