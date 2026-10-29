import type { ESLint, Rule } from "eslint";
import {
  ariaValidRule,
  draggingAlternativeRule,
  focusNotObscuredRule,
  formErrorAssociationRule,
  headingOrderRule,
  inputAutocompleteRule,
  landmarksSkipLinkRule,
  mediaCaptionsRule,
  noPositiveTabindexRule,
  pasteBlockedRule,
  reducedMotionRule,
  statusMessagesRule,
  viewportZoomRule,
} from "./rules/additional.js";
import { clickableNonInteractiveRule } from "./rules/clickable-non-interactive.js";
import { nonTextContrastRule, textContrastRule } from "./rules/contrast-rules.js";
import { dialogTitleRule } from "./rules/dialog-title.js";
import { focusVisibleRemovedRule } from "./rules/focus-visible-removed.js";
import { formLabelRule } from "./rules/form-label.js";
import { htmlLangRule } from "./rules/html-lang.js";
import { iconButtonNameRule } from "./rules/icon-button-name.js";
import { imgAltRule } from "./rules/img-alt.js";
import { linkNameRule } from "./rules/link-name.js";
import { pageTitleRule } from "./rules/page-title.js";
import { targetSizeRule } from "./rules/target-size.js";

export {
  RULE_IDS,
  TOOL_VERSION,
  getMessageMeta,
  getRule,
  ruleCatalog,
} from "./catalog.js";
export type {
  FindingStatus,
  MessageMeta,
  RuleDefinition,
  RuleKind,
  Severity,
  WcagCriterion,
} from "./catalog.js";
export { extractStaticTitle, isAppPage, isPagesRouterPage } from "./ast.js";
export type { AnyNode } from "./ast.js";

const rules: Record<string, Rule.RuleModule> = {
  "img-alt": imgAltRule,
  "icon-button-name": iconButtonNameRule,
  "clickable-non-interactive": clickableNonInteractiveRule,
  "focus-visible-removed": focusVisibleRemovedRule,
  "form-label": formLabelRule,
  "html-lang": htmlLangRule,
  "page-title": pageTitleRule,
  "link-name": linkNameRule,
  "dialog-title": dialogTitleRule,
  "target-size": targetSizeRule,
  "text-contrast": textContrastRule,
  "non-text-contrast": nonTextContrastRule,
  "form-error-association": formErrorAssociationRule,
  "input-autocomplete": inputAutocompleteRule,
  "heading-order": headingOrderRule,
  "landmarks-skip-link": landmarksSkipLinkRule,
  "focus-not-obscured": focusNotObscuredRule,
  "dragging-alternative": draggingAlternativeRule,
  "no-positive-tabindex": noPositiveTabindexRule,
  "aria-valid": ariaValidRule,
  "viewport-zoom": viewportZoomRule,
  "paste-blocked": pasteBlockedRule,
  "reduced-motion": reducedMotionRule,
  "media-captions": mediaCaptionsRule,
  "status-messages": statusMessagesRule,
};

const plugin = {
  meta: {
    name: "eslint-plugin-a11ycn",
    version: "0.2.0",
  },
  rules,
} satisfies ESLint.Plugin;

export default plugin;
