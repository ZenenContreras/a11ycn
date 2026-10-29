import type { Rule } from "eslint";
import {
  assignParents,
  elementName,
  emptyImports,
  hasSpread,
  isIconElement,
  recordImport,
  staticAttr,
  subtreeHas,
  textKind,
  type AnyNode,
  type ImportMap,
} from "../ast.js";

const BUTTONS = new Set(["button", "Button", "IconButton"]);

export const iconButtonNameRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require an accessible name on icon-only buttons.",
    },
    schema: [],
    messages: {
      iconOnly: "Icon-only button has no accessible name.",
    },
  },
  create(context) {
    const imports = emptyImports();
    const elements: AnyNode[] = [];
    let program: AnyNode | undefined;

    return {
      Program(node) {
        program = node as unknown as AnyNode;
      },
      ImportDeclaration(node) {
        recordImport(imports, node as unknown as AnyNode);
      },
      JSXElement(node: Rule.Node) {
        elements.push(node as unknown as AnyNode);
      },
      "Program:exit"() {
        if (program) assignParents(program);
        for (const element of elements) {
          if (!isUnnamedIconButton(element, imports)) continue;
          context.report({ node: element as unknown as Rule.Node, messageId: "iconOnly" });
        }
      },
    };
  },
};

function isUnnamedIconButton(element: AnyNode, imports: ImportMap): boolean {
  const name = elementName(element);
  if (!name || !BUTTONS.has(name)) return false;
  if (hasAriaName(element)) return false;
  if (hasSpread(element)) return false;
  const named = textKind(element, true);
  if (named !== "none") return false;
  return containsIcon(element, imports);
}

function hasAriaName(element: AnyNode): boolean {
  for (const attr of ["aria-label", "aria-labelledby"]) {
    const value = staticAttr(element, attr);
    if (value.kind === "string" || value.kind === "unknown") return true;
  }
  return false;
}

function containsIcon(element: AnyNode, imports: ImportMap): boolean {
  const seen = new WeakSet<AnyNode>();
  const stack = [...jsxChildElements(element)];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (isIconElement(current, imports)) return true;
    stack.push(...jsxChildElements(current));
  }
  return subtreeHas(element, new Set(["svg", "img"]));
}

function jsxChildElements(element: AnyNode): AnyNode[] {
  return ((element.children as AnyNode[] | undefined) ?? []).filter(
    (child) => child.type === "JSXElement",
  );
}
