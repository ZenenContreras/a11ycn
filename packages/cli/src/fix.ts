import { createTwoFilesPatch } from "diff";
import { getMessageMeta } from "eslint-plugin-a11ycn";

export function buildFix(input: {
  file: string;
  line: number;
  lineText: string;
  ruleId: string;
  messageId: string;
}): { description: string; diff: string } {
  const meta = getMessageMeta(input.ruleId, input.messageId);
  const description = meta?.fixDescription ?? "Update this element so it meets the rule.";
  const after = suggestLine(input.lineText, input.ruleId, input.messageId);
  return {
    description,
    diff: unifiedDiff(input.file, input.lineText, after),
  };
}

export function suggestLine(line: string, ruleId: string, messageId: string): string {
  switch (ruleId) {
    case "img-alt":
      return messageId === "missingAlt" ? insertAlt(line) : replaceAlt(line);
    case "icon-button-name":
      return insertAttribute(line, "button", 'aria-label="Describe this action"');
    case "clickable-non-interactive":
      return line.replace(/<(div|span)\b/, '<button type="button"').replace(/<\/(div|span)>/, "</button>");
    case "focus-visible-removed":
      return addFocusClass(line);
    case "form-label":
      return addLabel(line);
    case "html-lang":
      return line.replace(/<html\b(?![^>]*\blang=)/, '<html lang="en"');
    case "page-title":
      return messageId === "duplicateTitle"
        ? line.replace(/title:\s*(["'`])[\s\S]*?\1/, 'title: "Describe this page"')
        : `export const metadata = { title: "Describe this page" };\n${line}`;
    case "link-name":
      return messageId === "generic" ? replaceGenericLink(line) : insertAttribute(line, "a", 'aria-label="Describe the destination"');
    case "dialog-title":
      return addDialogText(line, messageId);
    case "target-size":
      return bumpSize(line);
    default:
      return line;
  }
}

function unifiedDiff(file: string, before: string, after: string): string {
  const patch = createTwoFilesPatch(
    `a/${file}`,
    `b/${file}`,
    ensureNewline(before),
    ensureNewline(after),
    "",
    "",
    { context: 1 },
  );
  return patch
    .split("\n")
    .filter((diffLine) => !/^=+$/.test(diffLine) && !diffLine.startsWith("Index:"))
    .join("\n")
    .trimEnd();
}

function ensureNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function insertAlt(line: string): string {
  if (/\balt\s*=/.test(line)) return replaceAlt(line);
  return line.replace(/<(img|Image)\b([^>]*?)(\s*\/?>)/, (_match, tag, rest, end) => {
    return `<${tag}${rest} alt="Describe this image"${end}`;
  });
}

function replaceAlt(line: string): string {
  if (/\balt\s*=/.test(line)) {
    return line.replace(/\balt\s*=\s*(?:\{["'`][^"'`]*["'`]\}|["'][^"']*["'])/, 'alt="Describe this image"');
  }
  return insertAlt(line);
}

function insertAttribute(line: string, tag: string, attribute: string): string {
  const pattern = new RegExp(`<(${tag}|Button|IconButton|Link)\\b(?![^>]*\\baria-label)`, "i");
  if (!pattern.test(line)) return `${line}\n${attribute}`;
  return line.replace(pattern, `<$1 ${attribute}`);
}

function addFocusClass(line: string): string {
  const addition = "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  if (line.includes('className="')) return line.replace('className="', `className="${addition} `);
  if (line.includes("className={'")) return line.replace("className={'", `className={'${addition} `);
  if (line.includes('className={"')) return line.replace('className={"', `className={"${addition} `);
  return line.replace(/>/, ` className="${addition}">`);
}

function addLabel(line: string): string {
  const placeholder = line.match(/placeholder\s*=\s*(?:"([^"]+)"|'([^']+)')/);
  const label = placeholder?.[1] || placeholder?.[2] || "Label";
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field";
  const tagged = /\sid\s*=/.test(line)
    ? line
    : line.replace(/<(Input|Textarea|Checkbox|SelectTrigger|input|textarea|select)\b/, `<$1 id="${id}"`);
  return `<Label htmlFor="${id}">${label}</Label>\n${tagged}`;
}

function replaceGenericLink(line: string): string {
  const phrases = ["click here", "read more", "learn more", "leer más", "leer mas", "aquí", "aqui", "acá", "aca"];
  const pattern = new RegExp(phrases.map(escapeRegExp).join("|"), "i");
  if (pattern.test(line)) return line.replace(pattern, "Describe the destination");
  return `${line} Describe the destination`;
}

function addDialogText(line: string, messageId: string): string {
  const match = line.match(/\b(Dialog|AlertDialog|Sheet|Drawer)/);
  const prefix = match?.[1] ?? "Dialog";
  if (messageId === "missingDescription") {
    return `${line}\n<${prefix}Description>Explain the purpose of this dialog.</${prefix}Description>`;
  }
  return `${line}\n<${prefix}Title>Describe this dialog</${prefix}Title>\n<${prefix}Description>Explain the purpose of this dialog.</${prefix}Description>`;
}

function bumpSize(line: string): string {
  const small = "(?:0|px|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5)";
  return line
    .replace(new RegExp(`\\bsize-${small}\\b`, "g"), "size-6")
    .replace(new RegExp(`\\bh-${small}\\b`, "g"), "h-6")
    .replace(new RegExp(`\\bw-${small}\\b`, "g"), "w-6");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
