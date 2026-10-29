import type { Rule } from "eslint";
import { classTokens, type AnyNode } from "../ast.js";

const REMOVES_FOCUS = new Set([
  "outline-none",
  "outline-0",
  "focus:outline-none",
  "focus:outline-0",
  "focus-visible:outline-none",
  "focus-visible:outline-0",
]);

export const focusVisibleRemovedRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow removing the focus outline without a focus-visible replacement.",
    },
    schema: [],
    messages: {
      removed:
        "Focus outline is removed without a focus-visible:ring or focus-visible:outline replacement.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const tokens = classTokens(element);
        if (!tokens.some((token) => REMOVES_FOCUS.has(token))) return;
        if (tokens.some(isFocusVisibleReplacement)) return;
        context.report({ node, messageId: "removed" });
      },
    };
  },
};

function isFocusVisibleReplacement(token: string): boolean {
  if (token.startsWith("focus-visible:ring-offset")) return false;
  if (token === "focus-visible:ring-0" || token === "focus-visible:ring-none") return false;
  if (token === "focus-visible:ring" || token.startsWith("focus-visible:ring-")) return true;
  if (token === "focus-visible:outline") return true;
  if (token.startsWith("focus-visible:outline-") && !REMOVES_FOCUS.has(token)) return true;
  return false;
}
