import { messages as en, type MessageKey } from "../../../i18n/en.js";
import { messages as es } from "../../../i18n/es.js";

const CATALOGS = { en, es } as const;

export type Locale = keyof typeof CATALOGS;

export function availableLocales(): Locale[] {
  return Object.keys(CATALOGS) as Locale[];
}

export function isLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(CATALOGS, value);
}

export function normalizeLocale(value: string): string {
  const token = value.trim().toLowerCase().split(".")[0] ?? "";
  return token.split(/[_-]/)[0] ?? "";
}

/** Flag, then config, then A11YCN_LANG, then LANG/LC_ALL, then English. */
export function resolveLocale(input: {
  flag?: string | null;
  config?: string | null;
  env?: NodeJS.ProcessEnv;
}): { locale: Locale; error?: string } {
  const env = input.env ?? process.env;
  if (input.flag) {
    const code = normalizeLocale(input.flag);
    if (!isLocale(code)) return { locale: "en", error: code };
    return { locale: code };
  }
  if (input.config) {
    const code = normalizeLocale(input.config);
    if (isLocale(code)) return { locale: code };
  }
  const detected = normalizeLocale(env.A11YCN_LANG || env.LANG || env.LC_ALL || "");
  if (detected && isLocale(detected)) return { locale: detected };
  return { locale: "en" };
}

export function t(locale: Locale, key: MessageKey, vars?: Record<string, string>): string {
  const template = CATALOGS[locale][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => vars[name] ?? "");
}

export function translateField(
  locale: Locale,
  ruleId: string,
  messageId: string,
  field: "message" | "who" | "fix",
  english: string,
): string {
  const suffix = field === "message" ? "message" : field === "who" ? "who" : "fix";
  const key = `rules.${ruleId}.${messageId}.${suffix}`;
  if (!isMessageKey(key)) return english;
  return t(locale, key, extractVars(ruleId, messageId, english));
}

function isMessageKey(value: string): value is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, value);
}

function extractVars(ruleId: string, messageId: string, english: string): Record<string, string> {
  const id = `${ruleId}.${messageId}`;
  const quoted = english.match(/"([^"]*)"/)?.[1] ?? "";
  if (id === "img-alt.genericAlt" || id === "img-alt.filenameAlt") return { alt: quoted };
  if (id === "link-name.generic") return { text: quoted };
  if (id === "aria-valid.invalidRole") return { role: quoted };
  if (id === "page-title.duplicateTitle") {
    const match = english.match(/"([^"]*)" is used by (\d+)/);
    return { title: match?.[1] ?? "", count: match?.[2] ?? "" };
  }
  if (id === "text-contrast.low") {
    const match = english.match(/([\d.]+):1, below the ([\d.]+):1/);
    return { ratio: match?.[1] ?? "", minimum: match?.[2] ?? "" };
  }
  if (id === "non-text-contrast.low") {
    const match = english.match(/for the (\w+) is ([\d.?]+):1/);
    return { part: match?.[1] ?? "", ratio: match?.[2] ?? "" };
  }
  if (id === "input-autocomplete.missingAutocomplete") {
    const match = english.match(/looks like (\S+)/);
    return { purpose: match?.[1] ?? "" };
  }
  if (id === "heading-order.skipped") {
    const match = english.match(/h(\d) to h(\d)/);
    return { from: match?.[1] ?? "", to: match?.[2] ?? "" };
  }
  if (id === "clickable-non-interactive.clickable") {
    const match = english.match(/<(\w+)>/);
    return { name: match?.[1] ?? "" };
  }
  if (id === "dialog-title.missingTitle" || id === "dialog-title.missingDescription") {
    const match = english.match(/^(\w+) has no (\w+)\.$/);
    return id.endsWith("missingTitle")
      ? { component: match?.[1] ?? "", title: match?.[2] ?? "" }
      : { component: match?.[1] ?? "", description: match?.[2] ?? "" };
  }
  if (id === "target-size.tooSmall") {
    const match = english.match(/is (.+) CSS pixels/);
    return { size: match?.[1] ?? "" };
  }
  if (id === "aria-valid.badAria") {
    const match = english.match(/Attribute (\S+)/);
    return { name: match?.[1] ?? "" };
  }
  return {};
}
