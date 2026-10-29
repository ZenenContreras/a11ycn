# Rules

Each rule has an id, a WCAG 2.2 criterion, a severity, and whether v0.1.0 checks it in the CLI. Criterion 4.1.1 Parsing is obsolete in WCAG 2.2 and is not used.

Severity: critical, serious, moderate, minor. "Heuristic" rules still need a human to confirm edge cases. "Deterministic" rules are decided from source.

## img-alt

- WCAG 1.1.1 Non-text Content (A). Severity: critical when `alt` is missing, serious when it is a filename or a generic word. Deterministic. Automated.
- Same idea as `jsx-a11y/alt-text`, extended to `next/image` and to alts that are filenames or words such as "image".
- Affects people using a screen reader, who otherwise hear nothing useful.
- Bad: `<img src="/hero.png" />`, `<img alt="hero.png" />`, `<Image alt="image" />`.
- Good: `<img src="/hero.png" alt="Team reviewing an inbox" />`. Decorative images use `alt=""`.

## icon-button-name

- WCAG 4.1.2 Name, Role, Value (A). Severity: critical. Deterministic. Automated.
- Affects screen reader users, who otherwise hear only "button".
- Bad: `<Button size="icon"><Menu /></Button>`.
- Good: `<Button size="icon" aria-label="Open menu"><Menu /><span className="sr-only">Open menu</span></Button>`.

## clickable-non-interactive

- WCAG 2.1.1 Keyboard (A) and 4.1.2 Name, Role, Value (A). Severity: critical. Deterministic. Automated.
- Same idea as `jsx-a11y/click-events-have-key-events` and `jsx-a11y/no-static-element-interactions`. The fix is a `<button>`, not a role bolted onto a div.
- Affects keyboard users.
- Bad: `<div onClick={open}>Open</div>`.
- Good: `<button type="button" onClick={open}>Open</button>`.

## focus-visible-removed

- WCAG 2.4.7 Focus Visible (AA). Severity: serious. Deterministic. Automated.
- `outline-none` or `focus:outline-none` must be paired with `focus-visible:ring-*` or `focus-visible:outline-*`.
- Affects keyboard users who cannot see where focus is.
- Bad: `<button className="outline-none">Save</button>`.
- Good: `<button className="outline-none focus-visible:ring-2 focus-visible:ring-ring">Save</button>`.

## text-contrast

- WCAG 1.4.3 Contrast (Minimum) (AA). Severity: serious. Heuristic. Not automated in v0.1.0.
- Text should reach 4.5:1, or 3:1 for large text (`text-lg` and bold, or `text-2xl` and up). Resolve Tailwind defaults and shadcn CSS variables. If the color cannot be resolved, mark `needs_review`.
- Affects people with low vision.
- Bad: `className="text-gray-400 bg-white"`.
- Good: `className="text-neutral-800 bg-white"`.

## non-text-contrast

- WCAG 1.4.11 Non-text Contrast (AA). Severity: serious. Heuristic. Not automated in v0.1.0.
- Input borders, informative icons, and focus indicators need 3:1 against the adjacent color.
- Affects people with low vision.

## form-label

- WCAG 1.3.1 Info and Relationships (A), 3.3.2 Labels or Instructions (A), and 4.1.2 Name, Role, Value (A). Severity: serious. Deterministic. Automated.
- Extends `jsx-a11y/label-has-associated-control` for shadcn `Input`, `Textarea`, `Select` (`SelectTrigger`), and `Checkbox`. Placeholder text is not a label. A `Label` with `htmlFor`, an `aria-label`, a wrapping label, or `FormLabel` inside the same `FormItem` counts.
- Affects screen reader users and anyone who cannot see the placeholder after they start typing.
- Bad: `<Input placeholder="Email" />`.
- Good: `<Label htmlFor="email">Email</Label><Input id="email" autoComplete="email" />`.

## form-error-association

- WCAG 3.3.1 Error Identification (A). Severity: serious. Deterministic. Not automated in v0.1.0.
- A visible error must be tied to the field with `aria-describedby`, and the field needs `aria-invalid`. shadcn `FormMessage` already does this inside `Form`.
- Affects screen reader users who otherwise do not hear why the field failed.

## input-autocomplete

- WCAG 1.3.5 Identify Input Purpose (AA). Severity: serious. Deterministic. Not automated in v0.1.0.
- Name, email, phone, address, and card fields need `autoComplete`. Related to `jsx-a11y/autocomplete-valid`.
- Affects people with cognitive disabilities and anyone using a password manager.

## html-lang

- WCAG 3.1.1 Language of Page (A). Severity: serious. Deterministic. Automated.
- `<html>` in `app/layout.tsx` or `pages/_document.tsx` needs `lang`.
- Affects screen reader users, because pronunciation depends on the language.
- Bad: `<html>`. Good: `<html lang="en">`.

## page-title

- WCAG 2.4.2 Page Titled (A). Severity: serious when missing, moderate when duplicated. Deterministic. Automated.
- Each App Router page and layout needs `metadata.title` or `generateMetadata`. The same static title on every route is a finding.
- Affects people using a screen reader or multiple tabs.
- Good: `export const metadata = { title: "Dashboard" }`.

## heading-order

- WCAG 1.3.1 Info and Relationships (A), best practice. Severity: moderate. Deterministic. Not automated in v0.1.0.
- One `h1` per page. Do not skip from `h2` to `h4`.
- Affects screen reader users navigating by heading.

## link-name

- WCAG 2.4.4 Link Purpose (In Context) (A). Severity: serious when empty or icon-only, moderate for generic text. Deterministic. Automated.
- Extends `jsx-a11y/anchor-has-content`. Generic phrases include "click here", "here", "read more", "learn more", "aquí", "acá", and "leer más" when that is the whole accessible name.
- Affects screen reader users who hear links out of context.
- Bad: `<Link href="/post">Read more</Link>`.
- Good: `<Link href="/post">Read the welcome post</Link>`.

## dialog-title

- WCAG 4.1.2 Name, Role, Value (A) and 1.3.1 Info and Relationships (A). Severity: serious for a missing title, moderate for a missing description. Deterministic. Automated.
- `Dialog`, `AlertDialog`, `Sheet`, and `Drawer` need their `Title`. If the title should not be visible, wrap it in `VisuallyHidden`. Also include the matching `Description`.
- Affects screen reader users when a dialog opens.
- Good: `<DialogTitle>Delete account</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription>`.

## landmarks-skip-link

- WCAG 2.4.1 Bypass Blocks (A). Severity: serious. Deterministic. Not automated in v0.1.0.
- The layout needs `<main>`, navigation needs `<nav>`, and the site needs a "Skip to content" link.
- Affects keyboard users who otherwise tab through the header on every page.

## target-size

- WCAG 2.5.8 Target Size (Minimum) (AA). Severity: serious when the size resolves, moderate `needs_review` when a class cannot be resolved. Heuristic. Automated.
- Fixed targets smaller than 24 by 24 CSS pixels fail. `size-5` is 20px. `h-4` is 16px. Padding counts toward the target (`h-4 w-4 p-1` is 24px). `size-6` is the smallest fixed size that passes with no extra padding.
- Affects people with limited precision and people tapping a phone.
- Bad: `<Button className="size-5" aria-label="Close"><X /></Button>`.
- Good: `<Button className="size-10" aria-label="Close"><X /></Button>`.

## focus-not-obscured

- WCAG 2.4.11 Focus Not Obscured (Minimum) (AA). Severity: moderate. Heuristic. Not automated in v0.1.0. Status should be `needs_review`.
- A sticky or fixed header or footer can cover the focused element when the page does not set `scroll-padding-top` or `scroll-mt`.
- Affects keyboard users.

## dragging-alternative

- WCAG 2.5.7 Dragging Movements (AA). Severity: serious. Heuristic. Not automated in v0.1.0.
- `dnd-kit`, `react-beautiful-dnd`, and similar lists need a button to move an item up and down.
- Affects people who cannot drag.

## no-positive-tabindex

- WCAG 2.4.3 Focus Order (A). Severity: serious. Deterministic. Not automated in v0.1.0.
- Same idea as `jsx-a11y/tabindex-no-positive`. `tabIndex` greater than 0 fights the natural order.
- Affects keyboard users.

## aria-valid

- WCAG 4.1.2 Name, Role, Value (A). Severity: serious. Deterministic. Not automated in v0.1.0.
- Same idea as `jsx-a11y/aria-role`, `jsx-a11y/aria-props`, and `jsx-a11y/role-supports-aria-props`, plus `aria-hidden="true"` on a focusable element.
- Affects screen reader users when the accessibility tree lies.

## viewport-zoom

- WCAG 1.4.4 Resize Text (AA). Severity: serious. Deterministic. Not automated in v0.1.0.
- Do not set `user-scalable=no` or `maximum-scale=1` in the Next viewport metadata or a meta tag.
- Affects people who need to zoom.

## paste-blocked

- WCAG 3.3.8 Accessible Authentication (Minimum) (AA). Severity: serious. Deterministic. Not automated in v0.1.0.
- Do not call `preventDefault` on `onPaste` for passwords or one-time codes.
- Affects people using a password manager.

## reduced-motion

- WCAG 2.3.3 Animation from Interactions (AAA) and 2.2.2 Pause, Stop, Hide (A) when motion lasts more than five seconds. Severity: minor. Heuristic. Not automated in v0.1.0.
- `animate-*`, transitions, and Framer Motion need `motion-reduce:` or `useReducedMotion`.
- Affects people with vestibular disorders.

## media-captions

- WCAG 1.2.2 Captions (Prerecorded) (A). Severity: serious, reported as minor until the check exists so it does not fail CI by surprise. Not automated in v0.1.0.
- `<video>` needs `<track kind="captions">`.
- Affects people who are deaf or hard of hearing.

## status-messages

- WCAG 4.1.3 Status Messages (AA). Severity: serious. Deterministic. Not automated in v0.1.0.
- Toasts and banners need `aria-live` or `role="status"`. Sonner and the shadcn Toaster already do this.
- Affects screen reader users.
