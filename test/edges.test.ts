import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { audit } from "../packages/cli/src/audit.js";
import { suggestLine } from "../packages/cli/src/fix.js";
import { renderConsole } from "../packages/cli/src/report/console.js";
import { renderMarkdown } from "../packages/cli/src/report/markdown.js";
import { loadCache } from "../packages/cli/src/scan/cache.js";
import { collectFiles, resolveTargets } from "../packages/cli/src/scan/files.js";
import { detectProject } from "../packages/cli/src/scan/project.js";
import { lintSource } from "../packages/cli/src/scan/static.js";
import { runCli } from "../packages/cli/src/index.js";
import type { Report } from "../packages/cli/src/types.js";

describe("edge cases", () => {
  it("builds fixes for each phase-1 rule", () => {
    expect(suggestLine('<img src="/a.png" />', "img-alt", "missingAlt")).toContain('alt="Describe this image"');
    expect(suggestLine('<img alt="image" />', "img-alt", "genericAlt")).toContain('alt="Describe this image"');
    expect(suggestLine('<button className="outline-none">Save</button>', "focus-visible-removed", "removed")).toContain(
      "focus-visible:ring-2",
    );
    expect(suggestLine("<button className={'outline-none'}>Save</button>", "focus-visible-removed", "removed")).toContain(
      "focus-visible:ring-2",
    );
    expect(suggestLine('<Input placeholder="Email" />', "form-label", "missingLabel")).toContain('htmlFor="email"');
    expect(suggestLine("<html>", "html-lang", "missingLang")).toContain('lang="en"');
    expect(suggestLine("export default function Page() {", "page-title", "missingTitle")).toContain("metadata");
    expect(suggestLine('title: "Harbor"', "page-title", "duplicateTitle")).toContain("Describe this page");
    expect(suggestLine('<Link href="/post">Read more</Link>', "link-name", "generic")).toContain(
      "Describe the destination",
    );
    expect(suggestLine("<DialogContent>", "dialog-title", "missingTitle")).toContain("DialogTitle");
    expect(suggestLine("<SheetContent>", "dialog-title", "missingDescription")).toContain("SheetDescription");
    expect(suggestLine('<button className="size-5 h-4 w-5">x</button>', "target-size", "tooSmall")).toContain("size-6");
    expect(suggestLine("<div />", "unknown-rule", "missing")).toBe("<div />");
  });

  it("renders console groups and score colors", () => {
    const report = sampleReport();
    const text = renderConsole(report);
    expect(text).toContain("icon-button-name");
    expect(text).toContain("Critical");
    expect(text).toContain("Serious");
    expect(text).toContain("Moderate");
    expect(text).toContain("Minor");
    expect(renderConsole({ ...report, summary: { ...report.summary, score: 95 }, findings: [] })).toContain(
      "No static findings",
    );
    expect(renderConsole({ ...report, summary: { ...report.summary, score: 75 } })).toContain("75/100");
    const markdown = renderMarkdown({ ...report, target: { ...report.target, url: "http://localhost:3000" } });
    expect(markdown).toContain("http://localhost:3000");
  });

  it("resolves default folders and detects stacks", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "a11ycn-proj-"));
    mkdirSync(path.join(directory, "src"));
    mkdirSync(path.join(directory, "app"));
    writeFileSync(path.join(directory, "src", "button.tsx"), "export const x = 1;\n");
    writeFileSync(path.join(directory, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0" } }));
    const targets = await resolveTargets(".", directory);
    expect(targets).toEqual([path.join(directory, "src"), path.join(directory, "app")]);
    const files = await collectFiles(targets);
    expect(files.some((file) => file.endsWith("button.tsx"))).toBe(true);
    const empty = mkdtempSync(path.join(tmpdir(), "a11ycn-empty-"));
    expect(await resolveTargets(".", empty)).toEqual([empty]);
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({ dependencies: { vite: "6.0.0", react: "19.0.0" } }),
    );
    mkdirSync(path.join(directory, "pages"));
    expect((await detectProject(directory)).framework).toBe("vite-react");
    writeFileSync(path.join(directory, "package.json"), JSON.stringify({ dependencies: { next: "15.0.0" } }));
    expect((await detectProject(path.join(directory, "src", "button.tsx"))).framework).toBe("next-app-router");
    mkdirSync(path.join(empty, "pages"));
    writeFileSync(path.join(empty, "package.json"), JSON.stringify({ devDependencies: { next: "15.0.0" } }));
    expect((await detectProject(empty)).framework).toBe("next-pages");
    expect(await loadCache(path.join(empty, "missing-cache"))).toEqual({ version: 1, entries: {} });
    writeFileSync(path.join(empty, "cache.json"), "{");
    expect(await loadCache(empty)).toEqual({ version: 1, entries: {} });
  });

  it("covers parser and rule branches that fixtures do not", () => {
    const source = `
      import * as Icons from "lucide-react";
      import { Image as NextImage } from "next/image";
      export const metadata = { title: \`Account\` };
      export function generateMetadata() { return { title: "Account" }; }
      export function View() {
        return (
          <div>
            <html lang={locale}><body /></html>
            <NextImage {...props} />
            <img alt={"image"} />
            <button {...props}><Icons.Menu /></button>
            <button aria-label=""><Icons.Menu /></button>
            <a href="/x">{label}</a>
            <Link href="/x">Learn more!</Link>
            <input type="hidden" />
            <input aria-hidden="true" />
            <button className="focus-visible:ring-0 outline-none">Save</button>
            <button className="hover:h-4 px-4 py-3">Save changes</button>
            <button className="min-h-6 min-w-6" aria-label="Close"><Icon className="h-4 w-4" /></button>
            <Dialog><DialogTitle>Hi</DialogTitle><DialogDescription>There</DialogDescription></Dialog>
            <Head><title>Pages title</title></Head>
          </div>
        );
      }
    `;
    const findings = lintSource(source, "pages/index.tsx").findings;
    const rules = findings.map((finding) => `${finding.ruleId}:${finding.messageId}`);
    expect(rules).toContain("img-alt:genericAlt");
    expect(rules).toContain("icon-button-name:iconOnly");
    expect(rules).toContain("link-name:generic");
    expect(rules).not.toContain("page-title:missingTitle");
    expect(rules).toContain("focus-visible-removed:removed");

    const layout = `
      export const metadata = baseMetadata;
      export default function Layout({ children }) {
        return <html lang=""><body>{children}</body></html>;
      }
    `;
    const layoutFindings = lintSource(layout, "app/layout.tsx").findings.map((finding) => finding.ruleId);
    expect(layoutFindings).toContain("html-lang");
    expect(layoutFindings).not.toContain("page-title");
  });

  it("returns 1 for a missing path and infers json output", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const missing = await runCli(["node", "a11ycn", "audit", "does/not/exist", "--no-cache"]);
    expect(missing).toBe(1);
    expect(error).toHaveBeenCalled();
    const directory = mkdtempSync(path.join(tmpdir(), "a11ycn-json-"));
    const previous = process.cwd();
    process.chdir(directory);
    writeFileSync(path.join(directory, "ok.tsx"), "export const value = 1;\n");
    try {
      const code = await runCli(["node", "a11ycn", "audit", "ok.tsx", "--out", "report.json", "--no-cache"]);
      expect(code).toBe(0);
    } finally {
      process.chdir(previous);
    }
    const result = await audit({
      path: "fixtures/img-alt/good.tsx",
      failOn: "minor",
      cache: false,
      cwd: path.resolve(import.meta.dirname, ".."),
      url: "http://localhost:3000",
    });
    expect(result.warnings[0]).toMatch(/Playwright/);
    expect(result.report.target.url).toBe("http://localhost:3000");
  });
});

function sampleReport(): Report {
  return {
    tool: "a11ycn",
    version: "0.1.0",
    generatedAt: "2026-10-28T12:00:00.000Z",
    target: { path: "app", url: null, framework: "unknown", shadcn: false },
    summary: { score: 40, critical: 1, serious: 1, moderate: 1, minor: 1, filesScanned: 1 },
    findings: [
      finding("critical", "icon-button-name"),
      finding("serious", "form-label"),
      finding("moderate", "link-name"),
      finding("minor", "reduced-motion"),
    ],
    manualChecks: [{ id: "keyboard-only", status: "todo", notes: "Check it." }],
  };
}

function finding(severity: Report["findings"][number]["severity"], ruleId: string): Report["findings"][number] {
  return {
    id: "A11Y-0001",
    ruleId,
    wcag: [{ criterion: "4.1.2", name: "Name, Role, Value", level: "A" }],
    severity,
    status: "confirmed",
    source: "static",
    file: "app/page.tsx",
    line: 1,
    column: 1,
    snippet: "<button />",
    message: "Example",
    whoIsAffected: "People",
    fix: { description: "Fix it.", diff: "--- a\n+++ b" },
    docs: "https://example.com",
  };
}
