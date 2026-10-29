import type { Rule } from "eslint";
import { elementName, findAttribute, staticAttr, type AnyNode } from "../ast.js";

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "tab",
]);

export const clickableNonInteractiveRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow click handlers on div and span without full keyboard support.",
    },
    schema: [],
    messages: {
      clickable:
        "Clickable <{{name}}> is not keyboard operable. Use a <button> instead.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (name !== "div" && name !== "span") return;
        if (!findAttribute(element, "onClick")) return;
        if (isFullyKeyboardable(element)) return;
        context.report({
          node,
          messageId: "clickable",
          data: { name },
        });
      },
    };
  },
};

function isFullyKeyboardable(element: AnyNode): boolean {
  const role = staticAttr(element, "role");
  const interactive =
    (role.kind === "string" && INTERACTIVE_ROLES.has(role.value.toLowerCase())) ||
    role.kind === "unknown";
  const tabIndex = Boolean(findAttribute(element, "tabIndex"));
  const keyboard = Boolean(
    findAttribute(element, "onKeyDown") ||
      findAttribute(element, "onKeyUp") ||
      findAttribute(element, "onKeyPress"),
  );
  return interactive && tabIndex && keyboard;
}
