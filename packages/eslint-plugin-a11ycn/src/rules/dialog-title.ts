import type { Rule } from "eslint";
import { elementName, subtreeHas, type AnyNode } from "../ast.js";

const DIALOGS = [
  {
    root: "Dialog",
    content: "DialogContent",
    title: "DialogTitle",
    description: "DialogDescription",
  },
  {
    root: "AlertDialog",
    content: "AlertDialogContent",
    title: "AlertDialogTitle",
    description: "AlertDialogDescription",
  },
  {
    root: "Sheet",
    content: "SheetContent",
    title: "SheetTitle",
    description: "SheetDescription",
  },
  {
    root: "Drawer",
    content: "DrawerContent",
    title: "DrawerTitle",
    description: "DrawerDescription",
  },
];

export const dialogTitleRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a title and description on shadcn dialogs, sheets, and drawers.",
    },
    schema: [],
    messages: {
      missingTitle: "{{component}} has no {{title}}.",
      missingDescription: "{{component}} has no {{description}}.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (!name) return;
        for (const dialog of DIALOGS) {
          const isContent = name === dialog.content;
          const isRoot = name === dialog.root && !subtreeHas(element, new Set([dialog.content]));
          if (!isContent && !isRoot) continue;
          if (!subtreeHas(element, new Set([dialog.title]))) {
            context.report({
              node,
              messageId: "missingTitle",
              data: { component: name, title: dialog.title },
            });
          }
          if (!subtreeHas(element, new Set([dialog.description]))) {
            context.report({
              node,
              messageId: "missingDescription",
              data: { component: name, description: dialog.description },
            });
          }
        }
      },
    };
  },
};
