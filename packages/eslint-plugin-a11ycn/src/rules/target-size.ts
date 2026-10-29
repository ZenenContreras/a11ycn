import type { Rule } from "eslint";
import {
  classTokens,
  elementName,
  findAttribute,
  hasSrOnly,
  staticAttr,
  textKind,
  type AnyNode,
} from "../ast.js";
import { boxFromTokens, compensatedSize } from "../tailwind-size.js";

const NAMED_CONTROLS = new Set(["button", "Button", "IconButton", "a", "Link"]);
const MIN = 24;

export const targetSizeRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Flag clickable targets whose fixed Tailwind size is under 24 by 24 CSS pixels.",
    },
    schema: [],
    messages: {
      tooSmall: "Clickable target is {{size}} CSS pixels, under the 24px minimum.",
      unresolved:
        "Clickable target has a size or padding class that could not be resolved to pixels.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        if (!isClickable(element)) return;
        const result = measure(element);
        if (!result) return;
        if (result === "unresolved") {
          context.report({ node, messageId: "unresolved" });
          return;
        }
        context.report({
          node,
          messageId: "tooSmall",
          data: { size: formatSize(result) },
        });
      },
    };
  },
};

function isClickable(element: AnyNode): boolean {
  const name = elementName(element);
  if (name && NAMED_CONTROLS.has(name)) return true;
  if (findAttribute(element, "onClick")) return true;
  const role = staticAttr(element, "role");
  return role.kind === "string" && (role.value === "button" || role.value === "link");
}

function measure(element: AnyNode): { width?: number; height?: number } | "unresolved" | null {
  const box = boxFromTokens(classTokens(element));
  if (box.unresolvedSize) return "unresolved";
  const own = compensatedSize(box);
  if (own.width !== undefined || own.height !== undefined) {
    if (!isUnder(own)) return null;
    if (box.unresolvedPad) return "unresolved";
    return own;
  }
  if (box.unresolvedPad) return null;
  const visible = textKind(element, false);
  if (visible !== "none") return null;
  const child = sizedChild(element);
  if (!child) return null;
  const childBox = boxFromTokens(classTokens(child));
  if (childBox.unresolvedSize) return "unresolved";
  const childSize = compensatedSize(childBox);
  const combined = {
    width: childSize.width === undefined ? undefined : childSize.width + box.padX,
    height: childSize.height === undefined ? undefined : childSize.height + box.padY,
  };
  if (!isUnder(combined)) return null;
  if (childBox.unresolvedPad) return "unresolved";
  return combined;
}

function isUnder(size: { width?: number; height?: number }): boolean {
  if (size.width === undefined && size.height === undefined) return false;
  return (size.width !== undefined && size.width < MIN) || (size.height !== undefined && size.height < MIN);
}

function sizedChild(element: AnyNode): AnyNode | undefined {
  const children = ((element.children as AnyNode[] | undefined) ?? []).filter(
    (child) => child.type === "JSXElement" && !hasSrOnly(child),
  );
  return children.find((child) => classTokens(child).some((token) => /^(size|w|h|min-w|min-h)-/.test(token)));
}

function formatSize(size: { width?: number; height?: number }): string {
  const width = size.width === undefined ? "auto" : String(size.width);
  const height = size.height === undefined ? "auto" : String(size.height);
  return `${width}×${height}`;
}
