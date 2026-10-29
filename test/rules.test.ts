import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lintSource } from "../packages/cli/src/scan/static.js";
import { duplicateTitleFindings } from "../packages/cli/src/scan/titles.js";

const root = path.resolve(import.meta.dirname, "..");

function scan(relativePath: string, rules?: string[]) {
  const filename = path.join(root, relativePath);
  const source = readFileSync(filename, "utf8");
  const result = lintSource(source, filename, rules);
  if (result.error) throw new Error(result.error);
  return result.findings;
}

describe("rule fixtures", () => {
  it("flags bad images and accepts useful or empty alt", () => {
    const bad = scan("fixtures/img-alt/bad.tsx", ["img-alt"]);
    expect(bad.map((finding) => finding.messageId)).toEqual([
      "missingAlt",
      "filenameAlt",
      "genericAlt",
      "filenameAlt",
    ]);
    expect(bad.map((finding) => finding.severity)).toEqual([
      "critical",
      "serious",
      "serious",
      "serious",
    ]);
    expect(scan("fixtures/img-alt/good.tsx")).toEqual([]);
  });

  it("flags unnamed icon buttons and accepts a real name", () => {
    const bad = scan("fixtures/icon-button-name/bad.tsx", ["icon-button-name"]);
    expect(bad).toHaveLength(3);
    expect(bad.every((finding) => finding.messageId === "iconOnly" && finding.severity === "critical")).toBe(
      true,
    );
    expect(scan("fixtures/icon-button-name/good.tsx")).toEqual([]);
  });

  it("flags clickable div and span elements", () => {
    const bad = scan("fixtures/clickable-non-interactive/bad.tsx", ["clickable-non-interactive"]);
    expect(bad.map((finding) => finding.message)).toEqual([
      'Clickable <div> is not keyboard operable. Use a <button> instead.',
      'Clickable <span> is not keyboard operable. Use a <button> instead.',
    ]);
    expect(scan("fixtures/clickable-non-interactive/good.tsx")).toEqual([]);
  });

  it("flags a removed focus outline without a focus-visible replacement", () => {
    const bad = scan("fixtures/focus-visible-removed/bad.tsx", ["focus-visible-removed"]);
    expect(bad).toHaveLength(2);
    expect(bad.every((finding) => finding.messageId === "removed" && finding.severity === "serious")).toBe(true);
    expect(scan("fixtures/focus-visible-removed/good.tsx")).toEqual([]);
  });

  it("flags unlabeled controls and ignores placeholder text", () => {
    const bad = scan("fixtures/form-label/bad.tsx", ["form-label"]);
    expect(bad).toHaveLength(5);
    expect(bad.every((finding) => finding.messageId === "missingLabel")).toBe(true);
    expect(scan("fixtures/form-label/good.tsx")).toEqual([]);
  });

  it("flags html without lang only in Next layouts and documents", () => {
    const bad = scan("fixtures/html-lang/bad/app/layout.tsx", ["html-lang"]);
    expect(bad.map((finding) => finding.messageId)).toEqual(["missingLang"]);
    expect(scan("fixtures/html-lang/good/app/layout.tsx")).toEqual([]);
    const widget = `
      export function Widget() {
        return <html><body>Not a document</body></html>;
      }
    `;
    expect(lintSource(widget, "components/widget.tsx").findings).toEqual([]);
    const document = `
      export default function Document() {
        return <html><body /></html>;
      }
    `;
    expect(lintSource(document, "pages/_document.tsx").findings.map((finding) => finding.ruleId)).toEqual([
      "html-lang",
    ]);
  });

  it("flags pages without a title and duplicate static titles", () => {
    const bad = scan("fixtures/page-title/bad/app/page.tsx", ["page-title"]);
    expect(bad.map((finding) => finding.messageId)).toEqual(["missingTitle"]);
    expect(scan("fixtures/page-title/good/app/page.tsx")).toEqual([]);
    const dynamic = `
      export async function generateMetadata() {
        return { title: "Account" };
      }
      export default function Page() {
        return <h1>Account</h1>;
      }
    `;
    expect(lintSource(dynamic, "app/account/page.tsx", ["page-title"]).findings).toEqual([]);
    const home = readFileSync(path.join(root, "fixtures/page-title/duplicate/app/home/page.tsx"), "utf8");
    const register = readFileSync(path.join(root, "fixtures/page-title/duplicate/app/register/page.tsx"), "utf8");
    const duplicates = duplicateTitleFindings([
      { file: path.join(root, "fixtures/page-title/duplicate/app/home/page.tsx"), source: home },
      { file: path.join(root, "fixtures/page-title/duplicate/app/register/page.tsx"), source: register },
    ]);
    expect(duplicates).toHaveLength(2);
    expect(duplicates.every((finding) => finding.messageId === "duplicateTitle" && finding.severity === "moderate")).toBe(
      true,
    );
  });

  it("flags empty, icon-only, and generic links", () => {
    const bad = scan("fixtures/link-name/bad.tsx", ["link-name"]);
    expect(bad.map((finding) => finding.messageId)).toEqual(["generic", "generic", "iconOnly", "empty"]);
    expect(bad.map((finding) => finding.severity)).toEqual(["moderate", "moderate", "serious", "serious"]);
    expect(scan("fixtures/link-name/good.tsx")).toEqual([]);
  });

  it("flags dialogs without a title or description", () => {
    const bad = scan("fixtures/dialog-title/bad.tsx", ["dialog-title"]);
    expect(bad.map((finding) => finding.messageId)).toEqual(["missingTitle", "missingDescription"]);
    expect(scan("fixtures/dialog-title/good.tsx")).toEqual([]);
    const sheet = `
      export function Filters() {
        return <Sheet><SheetContent><p>Filters</p></SheetContent></Sheet>;
      }
    `;
    expect(lintSource(sheet, "components/filters.tsx", ["dialog-title"]).findings.map((f) => f.messageId)).toEqual([
      "missingTitle",
      "missingDescription",
    ]);
  });

  it("flags clickable targets under 24px and allows padding that reaches 24px", () => {
    const bad = scan("fixtures/target-size/bad.tsx", ["target-size"]);
    expect(bad).toHaveLength(3);
    expect(bad.every((finding) => finding.messageId === "tooSmall" && finding.severity === "serious")).toBe(true);
    expect(bad[0]?.message).toContain("20×20");
    expect(scan("fixtures/target-size/good.tsx")).toEqual([]);
    const unresolved = `export function More() { return <button className="size-[length:var(--tap)]" aria-label="More">More</button>; }`;
    const result = lintSource(unresolved, path.join(root, "components/more.tsx"), ["target-size"]).findings;
    expect(result.map((finding) => finding.messageId)).toEqual(["unresolved"]);
    expect(result[0]?.status).toBe("needs_review");
  });
});
