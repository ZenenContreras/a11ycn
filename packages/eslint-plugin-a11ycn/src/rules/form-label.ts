import type { Rule } from "eslint";
import {
  ancestorNamed,
  assignParents,
  elementName,
  hasSpread,
  hasVisibleText,
  staticAttr,
  subtreeHas,
  type AnyNode,
} from "../ast.js";

const CONTROLS = new Set([
  "Input",
  "Textarea",
  "Checkbox",
  "SelectTrigger",
  "input",
  "textarea",
  "select",
]);

const HIDDEN_INPUT_TYPES = new Set(["hidden", "button", "submit", "reset", "image"]);

export const formLabelRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a programmatic label on form controls. Placeholder text does not count.",
    },
    schema: [],
    messages: {
      missingLabel:
        "Form control has no label. Placeholder text is not a label.",
    },
  },
  create(context) {
    const elements: AnyNode[] = [];
    let program: AnyNode | undefined;

    return {
      Program(node) {
        program = node as unknown as AnyNode;
      },
      JSXElement(node: Rule.Node) {
        elements.push(node as unknown as AnyNode);
      },
      "Program:exit"() {
        if (program) assignParents(program);
        const labelIds = new Set<string>();
        for (const element of elements) {
          const name = elementName(element);
          if (name !== "Label" && name !== "label") continue;
          const htmlFor = staticAttr(element, "htmlFor");
          if (htmlFor.kind === "string") labelIds.add(htmlFor.value);
        }
        for (const element of elements) {
          const name = elementName(element);
          if (!name || !CONTROLS.has(name)) continue;
          if (isHiddenInput(element)) continue;
          const hidden = staticAttr(element, "aria-hidden");
          if (hidden.kind === "string" && hidden.value === "true") continue;
          if (hasSpread(element)) continue;
          if (hasAriaName(element)) continue;
          const id = staticAttr(element, "id");
          if (id.kind === "string" && labelIds.has(id.value)) continue;
          if (labelAncestorHasText(element)) continue;
          const formItem = ancestorNamed(element, new Set(["FormItem"]));
          if (formItem && subtreeHas(formItem, new Set(["FormLabel"]))) continue;
          context.report({ node: element as unknown as Rule.Node, messageId: "missingLabel" });
        }
      },
    };
  },
};

function isHiddenInput(element: AnyNode): boolean {
  if (elementName(element) !== "input") return false;
  const type = staticAttr(element, "type");
  return type.kind === "string" && HIDDEN_INPUT_TYPES.has(type.value.toLowerCase());
}

function hasAriaName(element: AnyNode): boolean {
  for (const attr of ["aria-label", "aria-labelledby"]) {
    const value = staticAttr(element, attr);
    if (value.kind === "string" || value.kind === "unknown") return true;
  }
  return false;
}

function labelAncestorHasText(element: AnyNode): boolean {
  const label = ancestorNamed(element, new Set(["label", "Label"]));
  if (!label) return false;
  return hasVisibleText(label);
}
