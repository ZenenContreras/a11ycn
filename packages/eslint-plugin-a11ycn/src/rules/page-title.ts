import type { Rule } from "eslint";
import { hasTitleExport, isPageTitleFile, type AnyNode } from "../ast.js";

export const pageTitleRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a Next.js page title via metadata or generateMetadata.",
    },
    schema: [],
    messages: {
      missingTitle: "Page or layout has no metadata.title or generateMetadata.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!isPageTitleFile(filename)) return {};
    return {
      "Program:exit"(node) {
        const program = node as unknown as AnyNode;
        if (hasTitleExport(program, filename)) return;
        context.report({ node, messageId: "missingTitle" });
      },
    };
  },
};
