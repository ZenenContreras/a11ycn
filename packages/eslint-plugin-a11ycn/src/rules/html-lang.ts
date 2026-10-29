import type { Rule } from "eslint";
import { elementName, isHtmlLangFile, staticAttr, type AnyNode } from "../ast.js";

export const htmlLangRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require lang on the root html element of a Next.js layout or document.",
    },
    schema: [],
    messages: {
      missingLang: "<html> is missing a lang attribute.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!isHtmlLangFile(filename)) return {};
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        if (elementName(element) !== "html") return;
        const lang = staticAttr(element, "lang");
        if (lang.kind === "string" || lang.kind === "unknown") return;
        context.report({ node, messageId: "missingLang" });
      },
    };
  },
};
