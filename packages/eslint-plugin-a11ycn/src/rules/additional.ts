import type { Rule } from "eslint";
import {
  ancestorNamed,
  classTokens,
  elementName,
  findAttribute,
  isAppLayout,
  isAppPage,
  isPagesRouterPage,
  staticAttr,
  subtreeHas,
  type AnyNode,
} from "../ast.js";

const AUTOCOMPLETE_FIELDS: { pattern: RegExp; token: string }[] = [
  { pattern: /e-?mail/, token: "email" },
  { pattern: /phone|mobile|\btel\b/, token: "tel" },
  { pattern: /street|address|postal|zip\b|\bcity\b/, token: "street-address" },
  { pattern: /credit|cc-number|cardnumber|\bcard\b/, token: "cc-number" },
  { pattern: /full-?name|given-?name|family-?name|(^|[^a-z])name([^a-z]|$)/, token: "name" },
];

const VALID_ROLES = new Set([
  "alert", "alertdialog", "application", "article", "banner", "button", "cell", "checkbox",
  "columnheader", "combobox", "complementary", "contentinfo", "definition", "dialog",
  "directory", "document", "feed", "figure", "form", "grid", "gridcell", "group", "heading",
  "img", "link", "list", "listbox", "listitem", "log", "main", "marquee", "math", "menu",
  "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "navigation", "none", "note",
  "option", "presentation", "progressbar", "radio", "radiogroup", "region", "row", "rowgroup",
  "rowheader", "scrollbar", "search", "searchbox", "separator", "slider", "spinbutton",
  "status", "switch", "tab", "table", "tablist", "tabpanel", "term", "textbox", "timer",
  "toolbar", "tooltip", "tree", "treegrid", "treeitem",
]);

const ARIA_ATTRIBUTES = new Set([
  "aria-activedescendant", "aria-atomic", "aria-autocomplete", "aria-braillelabel",
  "aria-brailleroledescription", "aria-busy", "aria-checked", "aria-colcount", "aria-colindex",
  "aria-colindextext", "aria-colspan", "aria-controls", "aria-current", "aria-describedby",
  "aria-description", "aria-details", "aria-disabled", "aria-errormessage", "aria-expanded",
  "aria-flowto", "aria-haspopup", "aria-hidden", "aria-invalid", "aria-keyshortcuts",
  "aria-label", "aria-labelledby", "aria-level", "aria-live", "aria-modal", "aria-multiline",
  "aria-multiselectable", "aria-orientation", "aria-owns", "aria-placeholder", "aria-posinset",
  "aria-pressed", "aria-readonly", "aria-relevant", "aria-required", "aria-roledescription",
  "aria-rowcount", "aria-rowindex", "aria-rowindextext", "aria-rowspan", "aria-selected",
  "aria-setsize", "aria-sort", "aria-valuemax", "aria-valuemin", "aria-valuenow", "aria-valuetext",
]);

const FOCUSABLE = new Set(["button", "a", "input", "select", "textarea", "Button", "Link", "Input"]);
const DND_SOURCES = ["@dnd-kit/core", "@dnd-kit/sortable", "react-beautiful-dnd", "@hello-pangea/dnd"];

export const formErrorAssociationRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Associate visible errors with fields." },
    schema: [],
    messages: {
      missingAssociation: "Visible error message is not tied to its field with aria-describedby and aria-invalid.",
    },
  },
  create(context) {
    const elements: AnyNode[] = [];
    return {
      JSXElement(node: Rule.Node) {
        elements.push(node as unknown as AnyNode);
      },
      "Program:exit"() {
        const described = new Set<string>();
        for (const element of elements) {
          const value = staticAttr(element, "aria-describedby");
          if (value.kind === "string") value.value.split(/\s+/).forEach((id) => described.add(id));
        }
        for (const element of elements) {
          if (elementName(element) === "FormMessage") continue;
          if (!looksLikeError(element)) continue;
          const formItem = ancestorNamed(element, new Set(["FormItem"]));
          if (formItem && subtreeHas(formItem, new Set(["FormMessage"]))) continue;
          const id = staticAttr(element, "id");
          if (id.kind === "string" && described.has(id.value)) continue;
          context.report({ node: element as unknown as Rule.Node, messageId: "missingAssociation" });
        }
      },
    };
  },
};

export const inputAutocompleteRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Require autocomplete on inputs that collect personal information." },
    schema: [],
    messages: {
      missingAutocomplete: "This field looks like {{purpose}} and needs an autoComplete attribute.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (name !== "input" && name !== "Input") return;
        const type = staticAttr(element, "type");
        if (type.kind === "string" && ["hidden", "button", "submit", "checkbox", "radio", "file", "password", "reset"].includes(type.value.toLowerCase())) {
          return;
        }
        const autocomplete = staticAttr(element, "autoComplete");
        if (autocomplete.kind === "string" || autocomplete.kind === "unknown") return;
        const hint = [
          type.kind === "string" ? type.value : "",
          attr(element, "name"),
          attr(element, "id"),
          attr(element, "placeholder"),
        ].join(" ").toLowerCase();
        const match = AUTOCOMPLETE_FIELDS.find((field) => field.pattern.test(hint));
        if (!match) return;
        context.report({ node, messageId: "missingAutocomplete", data: { purpose: match.token } });
      },
    };
  },
};

export const headingOrderRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Keep a single h1 and do not skip heading levels." },
    schema: [],
    messages: {
      missingH1: "Page has no h1.",
      multipleH1: "Page has more than one h1.",
      skipped: "Heading level jumps from h{{from}} to h{{to}}.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!isAppPage(filename) && !isPagesRouterPage(filename)) return {};
    const headings: { level: number; node: Rule.Node }[] = [];
    return {
      JSXOpeningElement(node: Rule.Node) {
        const name = elementName(node as unknown as AnyNode);
        const match = name?.match(/^h([1-6])$/);
        if (!match?.[1]) return;
        headings.push({ level: Number(match[1]), node });
      },
      "Program:exit"(node) {
        const h1 = headings.filter((heading) => heading.level === 1);
        if (h1.length === 0) context.report({ node, messageId: "missingH1" });
        h1.slice(1).forEach((heading) => context.report({ node: heading.node, messageId: "multipleH1" }));
        let previous = 0;
        for (const heading of headings) {
          if (previous > 0 && heading.level > previous + 1) {
            context.report({
              node: heading.node,
              messageId: "skipped",
              data: { from: String(previous), to: String(heading.level) },
            });
          }
          previous = heading.level;
        }
      },
    };
  },
};

export const landmarksSkipLinkRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Require a skip link in layouts and a main landmark on pages." },
    schema: [],
    messages: {
      missingSkip: "Layout has no skip link.",
      missingMain: "Page has no <main> landmark.",
    },
  },
  create(context) {
    const filename = context.filename;
    const layout = isAppLayout(filename);
    const page = isAppPage(filename) || isPagesRouterPage(filename);
    if (!layout && !page) return {};
    let skip = false;
    let main = false;
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (name === "main") main = true;
        if (name === "a") {
          const href = staticAttr(element, "href");
          if (href.kind === "string" && href.value.startsWith("#")) skip = true;
        }
      },
      "Program:exit"(node) {
        if (layout && !skip) context.report({ node, messageId: "missingSkip" });
        if (page && !main) context.report({ node, messageId: "missingMain" });
      },
    };
  },
};

export const focusNotObscuredRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Sticky headers and footers can cover focused content." },
    schema: [],
    messages: {
      obscured: "Sticky or fixed header or footer may cover focused content. Add scroll-padding on the document.",
    },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (name !== "header" && name !== "footer") return;
        const tokens = classTokens(element);
        if (!tokens.some((token) => token === "sticky" || token === "fixed" || token.startsWith("sticky") || token.startsWith("fixed"))) {
          return;
        }
        context.report({ node, messageId: "obscured" });
      },
    };
  },
};

export const draggingAlternativeRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Dragging needs a button alternative." },
    schema: [],
    messages: {
      noAlternative: "Drag and drop is used without a button alternative such as move up and move down.",
    },
  },
  create(context) {
    let dragImport = false;
    let importNode: Rule.Node | undefined;
    return {
      ImportDeclaration(node: Rule.Node) {
        const source = (node as unknown as AnyNode).source as { value?: unknown } | undefined;
        if (typeof source?.value === "string" && DND_SOURCES.some((pkg) => source.value === pkg)) {
          dragImport = true;
          importNode = node;
        }
      },
      "Program:exit"() {
        if (!dragImport || !importNode) return;
        if (/move up|move down|mover arriba|mover abajo/i.test(context.sourceCode.getText())) return;
        context.report({ node: importNode, messageId: "noAlternative" });
      },
    };
  },
};

export const noPositiveTabindexRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow tabIndex greater than 0." },
    schema: [],
    messages: { positive: "tabIndex greater than 0 changes the natural focus order." },
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const value = staticAttr(element, "tabIndex");
        const numeric = numericAttr(element, "tabIndex");
        if (numeric != null && numeric > 0) context.report({ node, messageId: "positive" });
        else if (value.kind === "string" && Number(value.value) > 0) context.report({ node, messageId: "positive" });
      },
    };
  },
};

export const ariaValidRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Reject invalid roles, unknown aria attributes, and aria-hidden on focusable elements." },
    schema: [],
    messages: {
      invalidRole: 'Role "{{role}}" is not a valid ARIA role.',
      badAria: "Attribute {{name}} is not a valid aria attribute.",
      hiddenFocusable: "aria-hidden=\"true\" is set on a focusable element.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const role = staticAttr(element, "role");
        if (role.kind === "string" && !VALID_ROLES.has(role.value.toLowerCase())) {
          context.report({ node, messageId: "invalidRole", data: { role: role.value } });
        }
        const hidden = staticAttr(element, "aria-hidden");
        const name = elementName(element);
        const tab = numericAttr(element, "tabIndex");
        if (hidden.kind === "string" && hidden.value === "true" && name && (FOCUSABLE.has(name) || (tab != null && tab >= 0))) {
          context.report({ node, messageId: "hiddenFocusable" });
        }
        const attributes = ((element.attributes as AnyNode[] | undefined) ?? []);
        for (const attribute of attributes) {
          if (attribute.type !== "JSXAttribute") continue;
          const attrName = elementName(attribute.name as AnyNode);
          if (!attrName?.startsWith("aria-") || ARIA_ATTRIBUTES.has(attrName)) continue;
          context.report({ node, messageId: "badAria", data: { name: attrName } });
        }
      },
    };
  },
};

export const viewportZoomRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Do not disable page zoom." },
    schema: [],
    messages: { zoomBlocked: "Viewport blocks zoom with user-scalable=no or maximum-scale=1." },
  },
  create(context) {
    return {
      "Program:exit"(node) {
        const source = context.sourceCode.getText();
        if (/user-scalable\s*=\s*["']?no\b/i.test(source) || /userScalable\s*:\s*false/.test(source)) {
          context.report({ node, messageId: "zoomBlocked" });
          return;
        }
        if (/maximum-scale\s*=\s*["']?1(?:\D|$)/i.test(source) || /maximumScale\s*:\s*1\b/.test(source)) {
          context.report({ node, messageId: "zoomBlocked" });
        }
      },
    };
  },
};

export const pasteBlockedRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Do not block paste on passwords or one-time codes." },
    schema: [],
    messages: {
      pasteBlocked: "Paste is blocked on a password or one-time-code field.",
      pasteReview: "onPaste on a password or code field should be reviewed. It may block paste.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        const name = elementName(element);
        if (name !== "input" && name !== "Input" && name !== "textarea" && name !== "Textarea") return;
        if (!findAttribute(element, "onPaste")) return;
        const hint = [attr(element, "type"), attr(element, "name"), attr(element, "id"), attr(element, "placeholder"), attr(element, "autoComplete")].join(" ").toLowerCase();
        if (!/password|otp|one-time|pin\b|\bcode\b/.test(hint)) return;
        const handler = findAttribute(element, "onPaste");
        const text = handler ? context.sourceCode.getText(handler as unknown as Rule.Node) : "";
        if (text.includes("preventDefault")) context.report({ node, messageId: "pasteBlocked" });
        else context.report({ node, messageId: "pasteReview" });
      },
    };
  },
};

export const reducedMotionRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Offer a reduced-motion alternative for animation." },
    schema: [],
    messages: {
      motion: "Animation or transition has no motion-reduce or useReducedMotion alternative.",
    },
  },
  create(context) {
    let framer = false;
    let framerNode: Rule.Node | undefined;
    return {
      ImportDeclaration(node: Rule.Node) {
        const source = (node as unknown as AnyNode).source as { value?: unknown } | undefined;
        if (source?.value === "framer-motion") {
          framer = true;
          framerNode = node;
        }
      },
      JSXElement(node: Rule.Node) {
        const tokens = classTokens(node as unknown as AnyNode);
        const animated = tokens.some((token) => token.startsWith("animate-") || token === "transition" || token.startsWith("transition-"));
        if (!animated) return;
        if (tokens.some((token) => token.startsWith("motion-reduce:"))) return;
        context.report({ node, messageId: "motion" });
      },
      "Program:exit"() {
        if (!framer || !framerNode) return;
        if (context.sourceCode.getText().includes("useReducedMotion")) return;
        context.report({ node: framerNode, messageId: "motion" });
      },
    };
  },
};

export const mediaCaptionsRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Require captions on video." },
    schema: [],
    messages: { missingCaptions: "Video has no <track kind=\"captions\">." },
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as AnyNode;
        if (elementName(element) !== "video") return;
        if (subtreeHas(element, new Set(["track"])) && /kind\s*=\s*["']captions["']/.test(context.sourceCode.getText(node))) {
          return;
        }
        context.report({ node, messageId: "missingCaptions" });
      },
    };
  },
};

export const statusMessagesRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Status messages need an accessible live region." },
    schema: [],
    messages: { noLive: "Status message has no aria-live or role=\"status\". Sonner and the shadcn Toaster already provide this." },
  },
  create(context) {
    let sonner = false;
    const elements: AnyNode[] = [];
    return {
      ImportDeclaration(node: Rule.Node) {
        const source = (node as unknown as AnyNode).source as { value?: unknown } | undefined;
        if (source?.value === "sonner") sonner = true;
      },
      JSXElement(node: Rule.Node) {
        elements.push(node as unknown as AnyNode);
      },
      "Program:exit"() {
        if (sonner || elements.some((element) => elementName(element) === "Toaster")) return;
        for (const element of elements) {
          const name = elementName(element);
          const tokens = classTokens(element);
          const isStatus = name === "Toast" || tokens.includes("toast");
          if (!isStatus) continue;
          const live = staticAttr(element, "aria-live");
          const role = staticAttr(element, "role");
          if (live.kind === "string" || (role.kind === "string" && (role.value === "status" || role.value === "alert"))) continue;
          context.report({ node: element as unknown as Rule.Node, messageId: "noLive" });
        }
      },
    };
  },
};

function looksLikeError(element: AnyNode): boolean {
  const tokens = classTokens(element);
  return tokens.some((token) => token === "text-destructive" || token.startsWith("text-red-") || token.includes("error"));
}

function attr(element: AnyNode, name: string): string {
  const value = staticAttr(element, name);
  return value.kind === "string" ? value.value : "";
}

function numericAttr(element: AnyNode, name: string): number | null {
  const attribute = findAttribute(element, name);
  const value = attribute?.value as AnyNode | null | undefined;
  if (!value || value.type !== "JSXExpressionContainer") return null;
  const expression = value.expression as AnyNode | undefined;
  if (expression?.type === "Literal" && typeof expression.value === "number") return expression.value;
  return null;
}
