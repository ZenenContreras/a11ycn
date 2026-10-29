export interface AnyNode {
  type: string;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  parent?: AnyNode;
  [key: string]: unknown;
}

export interface ImportMap {
  images: Set<string>;
  icons: Set<string>;
  iconNamespaces: Set<string>;
  links: Set<string>;
}

export function emptyImports(): ImportMap {
  return {
    images: new Set(),
    icons: new Set(),
    iconNamespaces: new Set(),
    links: new Set(),
  };
}

export function childrenOf(node: AnyNode): AnyNode[] {
  const children: AnyNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) children.push(item);
      }
    } else if (isNode(value)) {
      children.push(value);
    }
  }
  return children;
}

export function assignParents(root: AnyNode): void {
  const seen = new WeakSet<AnyNode>();
  const stack: AnyNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || seen.has(node)) continue;
    seen.add(node);
    for (const child of childrenOf(node)) {
      child.parent = node;
      stack.push(child);
    }
  }
}

export function elementName(node: AnyNode | undefined): string | null {
  if (!node) return null;
  if (node.type === "JSXElement") {
    return nameToString((node.openingElement as AnyNode | undefined)?.name as AnyNode | undefined);
  }
  if (node.type === "JSXOpeningElement" || node.type === "JSXClosingElement") {
    return nameToString(node.name as AnyNode | undefined);
  }
  return nameToString(node);
}

export function openingOf(node: AnyNode): AnyNode {
  if (node.type === "JSXElement") return node.openingElement as AnyNode;
  return node;
}

export function hasSpread(node: AnyNode): boolean {
  const opening = openingOf(node);
  const attributes = (opening.attributes as AnyNode[] | undefined) ?? [];
  return attributes.some((attribute) => attribute.type === "JSXSpreadAttribute");
}

export function findAttribute(node: AnyNode, attrName: string): AnyNode | undefined {
  const opening = openingOf(node);
  const attributes = (opening.attributes as AnyNode[] | undefined) ?? [];
  return attributes.find((attribute) => {
    if (attribute.type !== "JSXAttribute") return false;
    return nameToString(attribute.name as AnyNode) === attrName;
  });
}

export type StaticAttr =
  | { kind: "missing" }
  | { kind: "empty" }
  | { kind: "boolean" }
  | { kind: "string"; value: string }
  | { kind: "unknown" };

export function staticAttr(node: AnyNode, attrName: string): StaticAttr {
  const attribute = findAttribute(node, attrName);
  if (!attribute) return { kind: "missing" };
  const value = attribute.value as AnyNode | null | undefined;
  if (value == null) return { kind: "boolean" };
  if (value.type === "Literal" || value.type === "JSXText") {
    const literal = value.value;
    if (typeof literal !== "string") return { kind: "unknown" };
    if (literal.trim() === "") return { kind: "empty" };
    return { kind: "string", value: literal };
  }
  if (value.type === "JSXExpressionContainer") {
    const expression = value.expression as AnyNode;
    if (!expression || expression.type === "JSXEmptyExpression") return { kind: "empty" };
    if (expression.type === "Literal" && typeof expression.value === "string") {
      if (expression.value.trim() === "") return { kind: "empty" };
      return { kind: "string", value: expression.value };
    }
    if (expression.type === "TemplateLiteral") {
      const expressions = (expression.expressions as unknown[] | undefined) ?? [];
      const quasis = (expression.quasis as AnyNode[] | undefined) ?? [];
      if (expressions.length === 0 && quasis[0]) {
        const cooked = quasiText(quasis[0]);
        if (cooked.trim() === "") return { kind: "empty" };
        return { kind: "string", value: cooked };
      }
    }
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}

export function classTokens(node: AnyNode): string[] {
  const attribute = findAttribute(node, "className");
  if (!attribute) return [];
  const value = attribute.value as AnyNode | null | undefined;
  if (!value) return [];
  return stringLiterals(value).flatMap(splitClassTokens);
}

export function stringLiterals(node: AnyNode): string[] {
  const found: string[] = [];
  const seen = new WeakSet<AnyNode>();
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (
      (current.type === "Literal" || current.type === "JSXText") &&
      typeof current.value === "string"
    ) {
      found.push(current.value);
    }
    if (current.type === "TemplateElement") {
      found.push(quasiText(current));
    }
    for (const child of childrenOf(current)) stack.push(child);
  }
  return found;
}

export function recordImport(map: ImportMap, node: AnyNode): void {
  if (node.type !== "ImportDeclaration") return;
  const source = (node.source as { value?: unknown } | undefined)?.value;
  if (typeof source !== "string") return;
  const specifiers = (node.specifiers as AnyNode[] | undefined) ?? [];
  for (const specifier of specifiers) {
    const local = localName(specifier);
    if (!local) continue;
    if (source === "next/image" || source === "next/legacy/image") map.images.add(local);
    if (source === "next/link") map.links.add(local);
    if (source === "lucide-react" || source === "@radix-ui/react-icons") {
      if (specifier.type === "ImportNamespaceSpecifier") map.iconNamespaces.add(local);
      else map.icons.add(local);
    }
  }
}

export function isIconElement(node: AnyNode, imports: ImportMap): boolean {
  const name = elementName(node);
  if (!name) return false;
  if (name === "svg" || name === "img") return true;
  if (imports.icons.has(name)) return true;
  if (name.endsWith("Icon")) return true;
  const parts = name.split(".");
  if (parts.length === 2 && parts[0] && parts[1] && imports.iconNamespaces.has(parts[0])) {
    return true;
  }
  return false;
}

export function hasSrOnly(node: AnyNode): boolean {
  return classTokens(node).includes("sr-only");
}

export function hasVisibleText(node: AnyNode): boolean {
  return textKind(node, false) === "text";
}

/** Visible and visually hidden text. `null` means a dynamic expression could not be resolved. */
export function collectText(node: AnyNode): string | null {
  let unknown = false;
  const parts: string[] = [];
  const visit = (current: AnyNode): void => {
    if (current.type === "JSXText" && typeof current.value === "string") {
      if (current.value.trim()) parts.push(current.value.trim());
      return;
    }
    if (current.type === "JSXExpressionContainer") {
      const expression = current.expression as AnyNode | undefined;
      if (!expression || expression.type === "JSXEmptyExpression") return;
      if (expression.type === "Literal" && typeof expression.value === "string") {
        if (expression.value.trim()) parts.push(expression.value.trim());
        return;
      }
      if (expression.type === "TemplateLiteral") {
        const expressions = (expression.expressions as unknown[] | undefined) ?? [];
        if (expressions.length === 0) {
          const quasis = (expression.quasis as AnyNode[] | undefined) ?? [];
          const text = quasis.map(quasiText).join("").trim();
          if (text) parts.push(text);
          return;
        }
      }
      if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
        visit(expression);
        return;
      }
      unknown = true;
      return;
    }
    if (current.type === "JSXElement") {
      const alt = staticAttr(current, "alt");
      if (alt.kind === "string") parts.push(alt.value);
      for (const child of jsxChildren(current)) visit(child);
      return;
    }
    if (current.type === "JSXFragment") {
      for (const child of jsxChildren(current)) visit(child);
    }
  };
  visit(node);
  if (unknown) return null;
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function textKind(node: AnyNode, countSrOnly: boolean): "text" | "none" | "unknown" {
  let unknown = false;
  const visit = (current: AnyNode, insideSrOnly: boolean): boolean => {
    if (current.type === "JSXText") {
      if (typeof current.value === "string" && current.value.trim() !== "") {
        if (countSrOnly || !insideSrOnly) return true;
      }
      return false;
    }
    if (current.type === "JSXExpressionContainer") {
      const expression = current.expression as AnyNode | undefined;
      if (!expression || expression.type === "JSXEmptyExpression") return false;
      if (expression.type === "Literal" && typeof expression.value === "string") {
        return expression.value.trim() !== "" && (countSrOnly || !insideSrOnly);
      }
      if (expression.type === "TemplateLiteral") {
        const expressions = (expression.expressions as unknown[] | undefined) ?? [];
        if (expressions.length === 0) {
          const quasis = (expression.quasis as AnyNode[] | undefined) ?? [];
          const text = quasis.map(quasiText).join("");
          return text.trim() !== "" && (countSrOnly || !insideSrOnly);
        }
      }
      if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
        return visit(expression, insideSrOnly);
      }
      unknown = true;
      return false;
    }
    if (current.type === "JSXElement") {
      const hidden = insideSrOnly || hasSrOnly(current);
      if (!countSrOnly && hidden) {
        return false;
      }
      const alt = staticAttr(current, "alt");
      if (alt.kind === "string") return true;
      for (const child of jsxChildren(current)) {
        if (visit(child, hidden)) return true;
      }
      return false;
    }
    if (current.type === "JSXFragment") {
      for (const child of jsxChildren(current)) {
        if (visit(child, insideSrOnly)) return true;
      }
    }
    return false;
  };

  if (visit(node, false)) return "text";
  if (unknown) return "unknown";
  return "none";
}

export function subtreeHas(node: AnyNode, names: Set<string>): boolean {
  const seen = new WeakSet<AnyNode>();
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (current.type === "JSXElement") {
      const name = elementName(current);
      if (name && names.has(name)) return true;
    }
    for (const child of childrenOf(current)) stack.push(child);
  }
  return false;
}

export function ancestorNamed(node: AnyNode, names: Set<string>): AnyNode | undefined {
  let current = node.parent;
  while (current) {
    if (current.type === "JSXElement") {
      const name = elementName(current);
      if (name && names.has(name)) return current;
    }
    current = current.parent;
  }
  return undefined;
}

export function normalizePath(filename: string): string {
  return filename.replace(/\\/g, "/");
}

export function isHtmlLangFile(filename: string): boolean {
  const file = normalizePath(filename);
  return (
    /(?:^|\/)app\/layout\.(tsx|jsx)$/.test(file) ||
    /(?:^|\/)pages\/_document\.(tsx|jsx)$/.test(file)
  );
}

export function isAppPage(filename: string): boolean {
  return /(?:^|\/)app\/(?:.*\/)?page\.(tsx|jsx)$/.test(normalizePath(filename));
}

export function isAppLayout(filename: string): boolean {
  return /(?:^|\/)app\/(?:.*\/)?layout\.(tsx|jsx)$/.test(normalizePath(filename));
}

export function isPagesRouterPage(filename: string): boolean {
  const file = normalizePath(filename);
  if (!/(?:^|\/)pages\/.+\.(tsx|jsx)$/.test(file)) return false;
  if (/(?:^|\/)pages\/api\//.test(file)) return false;
  if (/(?:^|\/)pages\/_[^/]+\.(tsx|jsx)$/.test(file)) return false;
  return true;
}

export function isPageTitleFile(filename: string): boolean {
  return isAppPage(filename) || isAppLayout(filename) || isPagesRouterPage(filename);
}

export function hasTitleExport(program: AnyNode, filename: string): boolean {
  const body = (program.body as AnyNode[] | undefined) ?? [];
  for (const statement of body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    if (statement.source && exportNames(statement).includes("generateMetadata")) return true;
    const declaration = statement.declaration as AnyNode | undefined;
    if (!declaration) {
      if (exportNames(statement).includes("generateMetadata")) return true;
      continue;
    }
    if (
      (declaration.type === "FunctionDeclaration" || declaration.type === "FunctionExpression") &&
      identifierName(declaration.id as AnyNode | undefined) === "generateMetadata"
    ) {
      return true;
    }
    if (declaration.type === "VariableDeclaration") {
      const declarators = (declaration.declarations as AnyNode[] | undefined) ?? [];
      for (const declarator of declarators) {
        const id = identifierName(declarator.id as AnyNode | undefined);
        if (id === "generateMetadata") return true;
        if (id === "metadata" && objectHasTitle(declarator.init as AnyNode | undefined)) return true;
        if (id === "metadata" && declarator.init && (declarator.init as AnyNode).type !== "ObjectExpression") {
          return true;
        }
      }
    }
  }
  if (isPagesRouterPage(filename) && subtreeHas(program, new Set(["title"]))) return true;
  return false;
}

function exportNames(statement: AnyNode): string[] {
  const specifiers = (statement.specifiers as AnyNode[] | undefined) ?? [];
  return specifiers
    .map((specifier) => identifierName((specifier.exported as AnyNode | undefined) ?? undefined))
    .filter((name): name is string => Boolean(name));
}

function objectHasTitle(node: AnyNode | undefined): boolean {
  if (!node || node.type !== "ObjectExpression") return false;
  const properties = (node.properties as AnyNode[] | undefined) ?? [];
  return properties.some((property) => {
    if (property.type !== "Property") return false;
    return propertyKey(property) === "title";
  });
}

function propertyKey(property: AnyNode): string | null {
  const key = property.key as AnyNode | undefined;
  if (!key) return null;
  if (key.type === "Identifier" && typeof key.name === "string") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

export function extractStaticTitle(program: AnyNode): { title: string; line: number } | null {
  const body = (program.body as AnyNode[] | undefined) ?? [];
  for (const statement of body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    const declaration = statement.declaration as AnyNode | undefined;
    if (!declaration || declaration.type !== "VariableDeclaration") continue;
    const declarators = (declaration.declarations as AnyNode[] | undefined) ?? [];
    for (const declarator of declarators) {
      if (identifierName(declarator.id as AnyNode | undefined) !== "metadata") continue;
      const found = titleFromObject(declarator.init as AnyNode | undefined);
      if (found) return found;
    }
  }
  return null;
}

function titleFromObject(node: AnyNode | undefined): { title: string; line: number } | null {
  if (!node || node.type !== "ObjectExpression") return null;
  const properties = (node.properties as AnyNode[] | undefined) ?? [];
  for (const property of properties) {
    if (property.type !== "Property" || propertyKey(property) !== "title") continue;
    const value = property.value as AnyNode | undefined;
    const line = property.loc?.start.line ?? node.loc?.start.line ?? 1;
    if (!value) return null;
    if (value.type === "Literal" && typeof value.value === "string" && value.value.trim()) {
      return { title: value.value.trim(), line };
    }
    if (value.type === "TemplateLiteral") {
      const expressions = (value.expressions as unknown[] | undefined) ?? [];
      const quasis = (value.quasis as AnyNode[] | undefined) ?? [];
      if (expressions.length === 0) {
        const text = quasis.map(quasiText).join("").trim();
        if (text) return { title: text, line };
      }
    }
    if (value.type === "ObjectExpression") {
      const nested = stringProperty(value, "absolute") ?? stringProperty(value, "default");
      if (nested) return { title: nested, line };
    }
  }
  return null;
}

function stringProperty(node: AnyNode, keyName: string): string | null {
  const properties = (node.properties as AnyNode[] | undefined) ?? [];
  for (const property of properties) {
    if (property.type !== "Property" || propertyKey(property) !== keyName) continue;
    const value = property.value as AnyNode | undefined;
    if (value?.type === "Literal" && typeof value.value === "string" && value.value.trim()) {
      return value.value.trim();
    }
  }
  return null;
}

function jsxChildren(node: AnyNode): AnyNode[] {
  return ((node.children as AnyNode[] | undefined) ?? []).filter(isNode);
}

function splitClassTokens(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/^!/, "").replace(/!$/, ""))
    .filter(Boolean);
}

function quasiText(node: AnyNode): string {
  const value = node.value as { cooked?: string; raw?: string } | undefined;
  return value?.cooked ?? value?.raw ?? "";
}

function localName(specifier: AnyNode): string | null {
  return identifierName(specifier.local as AnyNode | undefined);
}

function identifierName(node: AnyNode | undefined): string | null {
  if (!node) return null;
  if ((node.type === "Identifier" || node.type === "JSXIdentifier") && typeof node.name === "string") {
    return node.name;
  }
  return null;
}

function nameToString(node: AnyNode | undefined): string | null {
  if (!node) return null;
  if (node.type === "JSXIdentifier" || node.type === "Identifier") {
    return typeof node.name === "string" ? node.name : null;
  }
  if (node.type === "JSXMemberExpression") {
    const objectName = nameToString(node.object as AnyNode | undefined);
    const propertyName = nameToString(node.property as AnyNode | undefined);
    if (objectName && propertyName) return `${objectName}.${propertyName}`;
    return propertyName;
  }
  if (node.type === "JSXNamespacedName") {
    return nameToString(node.name as AnyNode | undefined);
  }
  return null;
}

function isNode(value: unknown): value is AnyNode {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      typeof (value as { type?: unknown }).type === "string",
  );
}
