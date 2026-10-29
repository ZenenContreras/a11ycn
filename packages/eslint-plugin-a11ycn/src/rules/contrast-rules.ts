import type { Rule } from "eslint";
import { classTokens, elementName, type AnyNode } from "../ast.js";
import { colorTokens, contrastRatio, isLargeText, loadCssVariables, resolveColor } from "../contrast.js";

const NON_TEXT = new Set(["input", "textarea", "select", "button", "a", "Input", "Textarea", "Button"]);

export const textContrastRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Flag Tailwind text and background pairs below WCAG contrast." },
    schema: [],
    messages: {
      low: "Text contrast is {{ratio}}:1, below the {{minimum}}:1 minimum.",
      unresolved: "Text and background colors could not be resolved. Check the contrast manually.",
    },
  },
  create(context) {
    const variables = loadCssVariables(context.filename);
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const tokens = classTokens(element);
        const text = colorTokens(tokens, "text");
        if (text.length === 0) return;
        const ownBackground = colorTokens(tokens, "bg");
        const parent = element.parent?.type === "JSXElement" ? element.parent : undefined;
        const parentBackground = parent ? colorTokens(classTokens(parent), "bg") : [];
        const background = ownBackground[0] ?? parentBackground[0];
        const foregroundToken = text[0];
        if (!foregroundToken || !background) return;
        const foreground = resolveColor(foregroundToken, variables);
        const back = resolveColor(background, variables);
        if (!foreground || !back) {
          context.report({ node, messageId: "unresolved" });
          return;
        }
        const ratio = contrastRatio(foreground, back);
        if (ratio == null) {
          context.report({ node, messageId: "unresolved" });
          return;
        }
        const minimum = isLargeText(tokens) ? 3 : 4.5;
        if (ratio + 0.05 < minimum) {
          context.report({
            node,
            messageId: "low",
            data: { ratio: ratio.toFixed(2), minimum: String(minimum) },
          });
        }
      },
    };
  },
};

export const nonTextContrastRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Flag borders and rings below the 3:1 non-text contrast minimum." },
    schema: [],
    messages: {
      low: "Non-text contrast for the {{part}} is {{ratio}}:1, below 3:1.",
      unresolved: "A border or ring color could not be checked against its background.",
    },
  },
  create(context) {
    const variables = loadCssVariables(context.filename);
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (!name || !NON_TEXT.has(name)) return;
        const tokens = classTokens(element);
        const parent = element.parent?.type === "JSXElement" ? element.parent : undefined;
        const backgroundToken =
          colorTokens(tokens, "bg")[0] ?? (parent ? colorTokens(classTokens(parent), "bg")[0] : undefined);
        for (const part of ["border", "ring"] as const) {
          const token = colorTokens(tokens, part)[0];
          if (!token) continue;
          if (!backgroundToken) return;
          const color = resolveColor(token, variables);
          const background = resolveColor(backgroundToken, variables);
          if (!color || !background) {
            context.report({ node, messageId: "unresolved", data: { part, ratio: "?" } });
            return;
          }
          const ratio = contrastRatio(color, background);
          if (ratio == null || ratio + 0.05 < 3) {
            context.report({
              node,
              messageId: "low",
              data: { part, ratio: ratio == null ? "?" : ratio.toFixed(2) },
            });
          }
        }
      },
    };
  },
};
