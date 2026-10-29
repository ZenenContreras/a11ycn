import type { Rule } from "eslint";
import {
  assignParents,
  elementName,
  emptyImports,
  hasSpread,
  recordImport,
  staticAttr,
  type AnyNode,
} from "../ast.js";

const GENERIC_ALT = new Set([
  "image",
  "img",
  "photo",
  "picture",
  "imagen",
  "foto",
  "icon",
  "graphic",
]);

const FILENAME_ALT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;

export const imgAltRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a useful text alternative on img and next/image.",
    },
    schema: [],
    messages: {
      missingAlt: "Image has no alt attribute.",
      genericAlt: 'Image alt is a generic word ("{{alt}}"), not a description.',
      filenameAlt: 'Image alt is a filename ("{{alt}}"), not a description.',
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
          const name = elementName(element);
          if (!name) continue;
          const isImg = name === "img";
          const isNextImage = imports.images.has(name);
          if (!isImg && !isNextImage) continue;
          if (hasSpread(element) && staticAttr(element, "alt").kind === "missing") continue;
          const alt = staticAttr(element, "alt");
          if (alt.kind === "missing") {
            context.report({ node: element as unknown as Rule.Node, messageId: "missingAlt" });
            continue;
          }
          if (alt.kind !== "string") continue;
          const trimmed = alt.value.trim();
          if (FILENAME_ALT.test(trimmed)) {
            context.report({
              node: element as unknown as Rule.Node,
              messageId: "filenameAlt",
              data: { alt: trimmed },
            });
            continue;
          }
          const generic = trimmed.toLowerCase().replace(/[.]+$/g, "");
          if (GENERIC_ALT.has(generic)) {
            context.report({
              node: element as unknown as Rule.Node,
              messageId: "genericAlt",
              data: { alt: trimmed },
            });
          }
        }
      },
    };
  },
};
