import type { Rule } from "eslint";
import {
  collectText,
  elementName,
  emptyImports,
  hasSpread,
  isIconElement,
  recordImport,
  staticAttr,
  type AnyNode,
  type ImportMap,
} from "../ast.js";

const GENERIC = new Set([
  "click here",
  "here",
  "read more",
  "learn more",
  "aquí",
  "aqui",
  "acá",
  "aca",
  "leer más",
  "leer mas",
]);

export const linkNameRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a destination-specific accessible name on links.",
    },
    schema: [],
    messages: {
      empty: "Link has no accessible name.",
      iconOnly: "Icon-only link has no accessible name.",
      generic: 'Link text "{{text}}" does not describe its destination.',
    },
  },
  create(context) {
    const imports = emptyImports();
    const elements: AnyNode[] = [];

    return {
      ImportDeclaration(node) {
        recordImport(imports, node as unknown as AnyNode);
      },
      JSXElement(node: Rule.Node) {
        elements.push(node as unknown as AnyNode);
      },
      "Program:exit"() {
        for (const element of elements) {
          const messageId = linkMessage(element, imports);
          if (!messageId) continue;
          const text = collectText(element) ?? "";
          context.report({
            node: element as unknown as Rule.Node,
            messageId,
            data: { text: normalize(text) },
          });
        }
      },
    };
  },
};

function linkMessage(element: AnyNode, imports: ImportMap): "empty" | "iconOnly" | "generic" | null {
  const name = elementName(element);
  if (!name) return null;
  const isAnchor = name === "a";
  const isLink = name === "Link" || imports.links.has(name);
  if (!isAnchor && !isLink) return null;
  if (hasAriaName(element) || hasSpread(element)) return null;
  const text = collectText(element);
  if (text === null) return null;
  if (text.trim() === "") return containsIcon(element, imports) ? "iconOnly" : "empty";
  if (GENERIC.has(normalize(text))) return "generic";
  return null;
}

function hasAriaName(element: AnyNode): boolean {
  for (const attr of ["aria-label", "aria-labelledby"]) {
    const value = staticAttr(element, attr);
    if (value.kind === "string" || value.kind === "unknown") return true;
  }
  return false;
}

function containsIcon(element: AnyNode, imports: ImportMap): boolean {
  const children = (element.children as AnyNode[] | undefined) ?? [];
  const stack = [...children];
  const seen = new WeakSet<AnyNode>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (current.type === "JSXElement" && isIconElement(current, imports)) return true;
    if (current.type === "JSXElement" || current.type === "JSXFragment") {
      stack.push(...((current.children as AnyNode[] | undefined) ?? []));
    }
    if (current.type === "JSXExpressionContainer" && current.expression) {
      stack.push(current.expression as AnyNode);
    }
  }
  return false;
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.!?…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
