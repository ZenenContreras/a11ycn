export const TOOL_VERSION = "0.2.0";

export type Severity = "critical" | "serious" | "moderate" | "minor";
export type FindingStatus = "confirmed" | "needs_review";
export type RuleKind = "deterministic" | "heuristic";

export interface WcagCriterion {
  criterion: string;
  name: string;
  level: "A" | "AA" | "AAA";
}

export interface MessageMeta {
  severity: Severity;
  status: FindingStatus;
  whoIsAffected: string;
  fixDescription: string;
}

export interface RuleDefinition {
  id: string;
  wcag: WcagCriterion[];
  kind: RuleKind;
  summary: string;
  jsxA11y?: string;
  messages: Record<string, MessageMeta>;
}

const screenReaderControl =
  "Screen reader users hear a control with no useful name.";
const keyboardUsers = "Keyboard users cannot reach or operate this control.";
const focusUsers = "Keyboard users cannot see which element has focus.";
const labelUsers =
  "Screen reader users are not told what to enter. A placeholder disappears while typing and is not a label.";
const linkUsers =
  "Screen reader users hear a link with no useful destination when links are read out of context.";
const dialogUsers = "Screen reader users are not told which dialog opened.";
const targetUsers =
  "People with limited precision, tremors, or who tap on a phone have a harder time hitting the control.";

export const ruleCatalog: Record<string, RuleDefinition> = {
  "img-alt": {
    id: "img-alt",
    wcag: [{ criterion: "1.1.1", name: "Non-text Content", level: "A" }],
    kind: "deterministic",
    summary:
      "Images and next/image need a text alternative. Filenames and words like \"image\" are not alternatives.",
    jsxA11y: "jsx-a11y/alt-text (extended for filenames, generic alts, and next/image)",
    messages: {
      missingAlt: {
        severity: "critical",
        status: "confirmed",
        whoIsAffected:
          "Screen reader users cannot tell what the image is, or that it is there.",
        fixDescription: "Add an alt attribute that describes the image, or alt=\"\" if it is decorative.",
      },
      genericAlt: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected:
          "Screen reader users hear a generic word instead of what the image shows.",
        fixDescription: "Replace the generic alt with a short description of the image.",
      },
      filenameAlt: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Screen reader users hear a filename instead of a description.",
        fixDescription: "Replace the filename alt with a short description of the image.",
      },
    },
  },
  "icon-button-name": {
    id: "icon-button-name",
    wcag: [{ criterion: "4.1.2", name: "Name, Role, Value", level: "A" }],
    kind: "deterministic",
    summary:
      "Icon-only buttons need an accessible name via aria-label, aria-labelledby, or a visually hidden span.",
    messages: {
      iconOnly: {
        severity: "critical",
        status: "confirmed",
        whoIsAffected: screenReaderControl,
        fixDescription:
          "Add aria-label, or a <span className=\"sr-only\"> with the action name.",
      },
    },
  },
  "clickable-non-interactive": {
    id: "clickable-non-interactive",
    wcag: [
      { criterion: "2.1.1", name: "Keyboard", level: "A" },
      { criterion: "4.1.2", name: "Name, Role, Value", level: "A" },
    ],
    kind: "deterministic",
    summary:
      "A div or span with onClick is not keyboard operable unless it is a real button.",
    jsxA11y:
      "jsx-a11y/click-events-have-key-events and jsx-a11y/no-static-element-interactions",
    messages: {
      clickable: {
        severity: "critical",
        status: "confirmed",
        whoIsAffected: keyboardUsers,
        fixDescription: "Use a <button type=\"button\"> instead of a clickable div or span.",
      },
    },
  },
  "focus-visible-removed": {
    id: "focus-visible-removed",
    wcag: [{ criterion: "2.4.7", name: "Focus Visible", level: "AA" }],
    kind: "deterministic",
    summary:
      "outline-none and focus:outline-none remove the focus ring unless focus-visible:ring or focus-visible:outline replaces it.",
    messages: {
      removed: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: focusUsers,
        fixDescription:
          "Add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2, or another focus-visible outline.",
      },
    },
  },
  "form-label": {
    id: "form-label",
    wcag: [
      { criterion: "1.3.1", name: "Info and Relationships", level: "A" },
      { criterion: "3.3.2", name: "Labels or Instructions", level: "A" },
      { criterion: "4.1.2", name: "Name, Role, Value", level: "A" },
    ],
    kind: "deterministic",
    summary:
      "Inputs need a label. Placeholder text, including on shadcn Input, Textarea, Select, and Checkbox, does not count.",
    jsxA11y: "jsx-a11y/label-has-associated-control (extended for shadcn FormLabel)",
    messages: {
      missingLabel: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: labelUsers,
        fixDescription:
          "Add a Label with htmlFor matching the control id, aria-label, or a FormLabel inside the same FormItem.",
      },
    },
  },
  "html-lang": {
    id: "html-lang",
    wcag: [{ criterion: "3.1.1", name: "Language of Page", level: "A" }],
    kind: "deterministic",
    summary: "The root <html> element in a Next.js layout or document needs a lang attribute.",
    messages: {
      missingLang: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Screen readers may pronounce the page in the wrong language.",
        fixDescription: "Set lang on <html>, for example <html lang=\"en\">.",
      },
    },
  },
  "page-title": {
    id: "page-title",
    wcag: [{ criterion: "2.4.2", name: "Page Titled", level: "A" }],
    kind: "deterministic",
    summary:
      "Each Next.js page and layout needs its own title. The same title on every route does not identify the page.",
    messages: {
      missingTitle: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected:
          "Screen reader and browser users cannot tell which page or view they are on.",
        fixDescription:
          "Export metadata with a unique title, or export generateMetadata.",
      },
      duplicateTitle: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected:
          "People using multiple tabs or a screen reader cannot tell these routes apart.",
        fixDescription: "Give each route a title that names that specific page.",
      },
    },
  },
  "link-name": {
    id: "link-name",
    wcag: [{ criterion: "2.4.4", name: "Link Purpose (In Context)", level: "A" }],
    kind: "deterministic",
    summary:
      "Links need a name that says where they go. Icon-only links and phrases like \"Read more\" or \"click here\" do not.",
    jsxA11y: "jsx-a11y/anchor-has-content (extended for generic link text and next/link)",
    messages: {
      empty: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: linkUsers,
        fixDescription: "Add visible link text or an aria-label that names the destination.",
      },
      iconOnly: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: linkUsers,
        fixDescription: "Add an aria-label or a <span className=\"sr-only\"> that names the destination.",
      },
      generic: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected: linkUsers,
        fixDescription: "Replace the generic phrase with text that names the destination.",
      },
    },
  },
  "dialog-title": {
    id: "dialog-title",
    wcag: [
      { criterion: "4.1.2", name: "Name, Role, Value", level: "A" },
      { criterion: "1.3.1", name: "Info and Relationships", level: "A" },
    ],
    kind: "deterministic",
    summary:
      "shadcn Dialog, AlertDialog, Sheet, and Drawer need a Title. If the title should not be visible, wrap it in VisuallyHidden. A Description should be present too.",
    messages: {
      missingTitle: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: dialogUsers,
        fixDescription:
          "Add DialogTitle, AlertDialogTitle, SheetTitle, or DrawerTitle. Wrap it in VisuallyHidden if it should not be shown.",
      },
      missingDescription: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected:
          "Screen reader users may not hear what the dialog is for beyond its name.",
        fixDescription:
          "Add DialogDescription (or the matching Sheet, Drawer, or AlertDialog description).",
      },
    },
  },
  "target-size": {
    id: "target-size",
    wcag: [{ criterion: "2.5.8", name: "Target Size (Minimum)", level: "AA" }],
    kind: "heuristic",
    summary:
      "Clickable targets should be at least 24 by 24 CSS pixels. Fixed Tailwind sizes such as size-5, h-5, or h-4 fail unless padding makes up the difference.",
    messages: {
      tooSmall: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: targetUsers,
        fixDescription:
          "Raise the fixed size to at least 24px (size-6, h-6 w-6) or add padding that brings the target to 24px.",
      },
      unresolved: {
        severity: "moderate",
        status: "needs_review",
        whoIsAffected: targetUsers,
        fixDescription:
          "Check the rendered target is at least 24 by 24 CSS pixels, including padding.",
      },
    },
  },
  "text-contrast": {
    id: "text-contrast",
    wcag: [{ criterion: "1.4.3", name: "Contrast (Minimum)", level: "AA" }],
    kind: "heuristic",
    summary: "Text and its background need 4.5:1, or 3:1 for large text. Colors come from Tailwind classes and shadcn CSS variables.",
    messages: {
      low: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "People with low vision cannot read this text.",
        fixDescription: "Darken the text or lighten the background until the contrast reaches the minimum.",
      },
      unresolved: {
        severity: "moderate",
        status: "needs_review",
        whoIsAffected: "People with low vision may not be able to read this text.",
        fixDescription: "Resolve the Tailwind or CSS variable colors and check the contrast.",
      },
    },
  },
  "non-text-contrast": {
    id: "non-text-contrast",
    wcag: [{ criterion: "1.4.11", name: "Non-text Contrast", level: "AA" }],
    kind: "heuristic",
    summary: "Borders and focus rings need 3:1 against the adjacent background.",
    messages: {
      low: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "People with low vision can miss borders and focus indicators.",
        fixDescription: "Strengthen the border or ring color until it reaches 3:1.",
      },
      unresolved: {
        severity: "moderate",
        status: "needs_review",
        whoIsAffected: "People with low vision can miss borders and focus indicators.",
        fixDescription: "Check the rendered border or ring against its background.",
      },
    },
  },
  "form-error-association": {
    id: "form-error-association",
    wcag: [{ criterion: "3.3.1", name: "Error Identification", level: "A" }],
    kind: "deterministic",
    summary: "A visible error must be referenced by aria-describedby, and the field needs aria-invalid. shadcn FormMessage already does this.",
    messages: {
      missingAssociation: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Screen reader users are not told which field failed or why.",
        fixDescription: "Set aria-invalid and aria-describedby on the field, pointing at the error message.",
      },
    },
  },
  "input-autocomplete": {
    id: "input-autocomplete",
    wcag: [{ criterion: "1.3.5", name: "Identify Input Purpose", level: "AA" }],
    kind: "deterministic",
    summary: "Name, email, phone, address, and card fields need autoComplete.",
    jsxA11y: "jsx-a11y/autocomplete-valid",
    messages: {
      missingAutocomplete: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "People using a password manager or who have cognitive disabilities cannot autofill the field.",
        fixDescription: "Add autoComplete with the matching token, such as email or name.",
      },
    },
  },
  "heading-order": {
    id: "heading-order",
    wcag: [{ criterion: "1.3.1", name: "Info and Relationships", level: "A" }],
    kind: "deterministic",
    summary: "A page needs one h1 and headings should not skip levels.",
    messages: {
      missingH1: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected: "Screen reader users navigating by heading cannot find the page topic.",
        fixDescription: "Add one h1 that names the page.",
      },
      multipleH1: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected: "Screen reader users hear more than one top-level heading.",
        fixDescription: "Keep a single h1 and demote the others.",
      },
      skipped: {
        severity: "moderate",
        status: "confirmed",
        whoIsAffected: "Screen reader users lose the structure of the page.",
        fixDescription: "Do not skip heading levels.",
      },
    },
  },
  "landmarks-skip-link": {
    id: "landmarks-skip-link",
    wcag: [{ criterion: "2.4.1", name: "Bypass Blocks", level: "A" }],
    kind: "deterministic",
    summary: "Layouts need a skip link and pages need a main landmark.",
    messages: {
      missingSkip: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Keyboard users must tab through the header on every page.",
        fixDescription: "Add a skip link as the first focusable control, pointing at the main content.",
      },
      missingMain: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Screen reader users cannot jump to the main content.",
        fixDescription: "Wrap the page content in <main>.",
      },
    },
  },
  "focus-not-obscured": {
    id: "focus-not-obscured",
    wcag: [{ criterion: "2.4.11", name: "Focus Not Obscured (Minimum)", level: "AA" }],
    kind: "heuristic",
    summary: "A sticky or fixed header or footer can cover the focused element when the page has no scroll padding.",
    messages: {
      obscured: {
        severity: "moderate",
        status: "needs_review",
        whoIsAffected: "Keyboard users can land on a control hidden behind a sticky bar.",
        fixDescription: "Add scroll-pt-* or scroll-padding-top on the scrolling element so focus clears the bar.",
      },
    },
  },
  "dragging-alternative": {
    id: "dragging-alternative",
    wcag: [{ criterion: "2.5.7", name: "Dragging Movements", level: "AA" }],
    kind: "heuristic",
    summary: "Drag and drop needs a single-pointer alternative such as move up and move down buttons.",
    messages: {
      noAlternative: {
        severity: "serious",
        status: "needs_review",
        whoIsAffected: "People who cannot drag have no way to reorder items.",
        fixDescription: "Add buttons that move an item up and down.",
      },
    },
  },
  "no-positive-tabindex": {
    id: "no-positive-tabindex",
    wcag: [{ criterion: "2.4.3", name: "Focus Order", level: "A" }],
    kind: "deterministic",
    summary: "tabIndex greater than 0 fights the natural focus order.",
    jsxA11y: "jsx-a11y/tabindex-no-positive",
    messages: {
      positive: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Keyboard users encounter controls in an unexpected order.",
        fixDescription: "Remove the positive tabIndex and order the controls in the DOM.",
      },
    },
  },
  "aria-valid": {
    id: "aria-valid",
    wcag: [{ criterion: "4.1.2", name: "Name, Role, Value", level: "A" }],
    kind: "deterministic",
    summary: "Roles and aria attributes must be valid, and aria-hidden must not sit on a focusable element.",
    jsxA11y: "jsx-a11y/aria-role, jsx-a11y/aria-props, and jsx-a11y/role-supports-aria-props",
    messages: {
      invalidRole: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Screen readers ignore or misread the element.",
        fixDescription: "Use a valid ARIA role, or a native element that already has that role.",
      },
      badAria: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "Assistive technology ignores the misspelled attribute.",
        fixDescription: "Correct the aria attribute name.",
      },
      hiddenFocusable: {
        severity: "critical",
        status: "confirmed",
        whoIsAffected: "Keyboard users can focus something a screen reader will not announce.",
        fixDescription: "Remove aria-hidden, or make the element unfocusable.",
      },
    },
  },
  "viewport-zoom": {
    id: "viewport-zoom",
    wcag: [{ criterion: "1.4.4", name: "Resize Text", level: "AA" }],
    kind: "deterministic",
    summary: "The viewport must not set user-scalable=no or maximum-scale=1.",
    messages: {
      zoomBlocked: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "People who need larger text cannot zoom the page.",
        fixDescription: "Remove user-scalable=no and maximum-scale=1 from the viewport.",
      },
    },
  },
  "paste-blocked": {
    id: "paste-blocked",
    wcag: [{ criterion: "3.3.8", name: "Accessible Authentication (Minimum)", level: "AA" }],
    kind: "deterministic",
    summary: "Do not call preventDefault on paste for passwords or one-time codes.",
    messages: {
      pasteBlocked: {
        severity: "serious",
        status: "confirmed",
        whoIsAffected: "People using a password manager cannot paste the password or code.",
        fixDescription: "Allow paste. Remove preventDefault from onPaste.",
      },
      pasteReview: {
        severity: "moderate",
        status: "needs_review",
        whoIsAffected: "People using a password manager may be blocked from pasting.",
        fixDescription: "Confirm onPaste does not cancel the paste event.",
      },
    },
  },
  "reduced-motion": {
    id: "reduced-motion",
    wcag: [{ criterion: "2.3.3", name: "Animation from Interactions", level: "AAA" }],
    kind: "heuristic",
    summary: "animate-*, transition, and framer-motion need a motion-reduce or useReducedMotion path.",
    messages: {
      motion: {
        severity: "minor",
        status: "confirmed",
        whoIsAffected: "People with vestibular disorders can get sick from motion they cannot turn off.",
        fixDescription: "Add a motion-reduce: variant or branch on useReducedMotion.",
      },
    },
  },
  "media-captions": {
    id: "media-captions",
    wcag: [{ criterion: "1.2.2", name: "Captions (Prerecorded)", level: "A" }],
    kind: "deterministic",
    summary: "A video element needs a captions track.",
    messages: {
      missingCaptions: {
        severity: "minor",
        status: "confirmed",
        whoIsAffected: "People who are deaf or hard of hearing cannot follow the video.",
        fixDescription: "Add <track kind=\"captions\" src=\"...\" srcLang=\"en\" label=\"English\" />.",
      },
    },
  },
  "status-messages": {
    id: "status-messages",
    wcag: [{ criterion: "4.1.3", name: "Status Messages", level: "AA" }],
    kind: "deterministic",
    summary: "Toasts and banners need aria-live or role=\"status\". Sonner and the shadcn Toaster already do this.",
    messages: {
      noLive: {
        severity: "minor",
        status: "confirmed",
        whoIsAffected: "Screen reader users are not told that the status changed.",
        fixDescription: "Add role=\"status\" or aria-live=\"polite\".",
      },
    },
  },
};

export const RULE_IDS = Object.keys(ruleCatalog);

export function getRule(ruleId: string): RuleDefinition | undefined {
  return ruleCatalog[ruleId];
}

export function getMessageMeta(ruleId: string, messageId: string): MessageMeta | undefined {
  return ruleCatalog[ruleId]?.messages[messageId];
}
