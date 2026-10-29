# a11ycn report

**a11ycn score:** 0/100

Scanned 7 files in `apps/demo/before`.
Framework: next-app-router. shadcn/ui: yes.

| Severity | Count |
| --- | --- |
| critical | 5 |
| serious | 15 |
| moderate | 4 |
| minor | 0 |

## Critical

### A11Y-0001 clickable-non-interactive

- **WCAG:** 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/dashboard/page.tsx:8:7
- **Status:** confirmed
- **Source:** static
- **Message:** Clickable <span> is not keyboard operable. Use a <button> instead.
- **Who is affected:** Keyboard users cannot reach or operate this control.

```tsx
<span onClick={() => {}}>Clear filters</span>
```

**Fix:** Use a <button type="button"> instead of a clickable div or span.

```diff
--- a/apps/demo/before/app/dashboard/page.tsx	
+++ b/apps/demo/before/app/dashboard/page.tsx	
@@ -1,1 +1,1 @@
-      <span onClick={() => {}}>Clear filters</span>
+      <button type="button" onClick={() => {}}>Clear filters</button>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#clickable-non-interactive

### A11Y-0002 icon-button-name

- **WCAG:** 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/dashboard/page.tsx:9:7
- **Status:** confirmed
- **Source:** static
- **Message:** Icon-only button has no accessible name.
- **Who is affected:** Screen reader users hear a control with no useful name.

```tsx
<button type="button" className="size-5">
```

**Fix:** Add aria-label, or a <span className="sr-only"> with the action name.

```diff
--- a/apps/demo/before/app/dashboard/page.tsx	
+++ b/apps/demo/before/app/dashboard/page.tsx	
@@ -1,1 +1,1 @@
-      <button type="button" className="size-5">
+      <button aria-label="Describe this action" type="button" className="size-5">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#icon-button-name

### A11Y-0003 img-alt

- **WCAG:** 1.1.1 Non-text Content (A)
- **File:** apps/demo/before/app/page.tsx:12:7
- **Status:** confirmed
- **Source:** static
- **Message:** Image has no alt attribute.
- **Who is affected:** Screen reader users cannot tell what the image is, or that it is there.

```tsx
<img src="/hero.png" />
```

**Fix:** Add an alt attribute that describes the image, or alt="" if it is decorative.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <img src="/hero.png" />
+      <img src="/hero.png" alt="Describe this image" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#img-alt

### A11Y-0004 clickable-non-interactive

- **WCAG:** 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/page.tsx:17:7
- **Status:** confirmed
- **Source:** static
- **Message:** Clickable <div> is not keyboard operable. Use a <button> instead.
- **Who is affected:** Keyboard users cannot reach or operate this control.

```tsx
<div onClick={() => {}}>View product tour</div>
```

**Fix:** Use a <button type="button"> instead of a clickable div or span.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <div onClick={() => {}}>View product tour</div>
+      <button type="button" onClick={() => {}}>View product tour</button>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#clickable-non-interactive

### A11Y-0005 icon-button-name

- **WCAG:** 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/components/header.tsx:11:7
- **Status:** confirmed
- **Source:** static
- **Message:** Icon-only button has no accessible name.
- **Who is affected:** Screen reader users hear a control with no useful name.

```tsx
<Button size="icon" className="size-5">
```

**Fix:** Add aria-label, or a <span className="sr-only"> with the action name.

```diff
--- a/apps/demo/before/components/header.tsx	
+++ b/apps/demo/before/components/header.tsx	
@@ -1,1 +1,1 @@
-      <Button size="icon" className="size-5">
+      <Button aria-label="Describe this action" size="icon" className="size-5">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#icon-button-name

## Serious

### A11Y-0006 page-title

- **WCAG:** 2.4.2 Page Titled (A)
- **File:** apps/demo/before/app/dashboard/page.tsx:1:1
- **Status:** confirmed
- **Source:** static
- **Message:** Page or layout has no metadata.title or generateMetadata.
- **Who is affected:** Screen reader and browser users cannot tell which page or view they are on.

```tsx
import { Trash } from "lucide-react";
```

**Fix:** Export metadata with a unique title, or export generateMetadata.

```diff
--- a/apps/demo/before/app/dashboard/page.tsx	
+++ b/apps/demo/before/app/dashboard/page.tsx	
@@ -1,1 +1,2 @@
+export const metadata = { title: "Describe this page" };
 import { Trash } from "lucide-react";
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#page-title

### A11Y-0007 target-size

- **WCAG:** 2.5.8 Target Size (Minimum) (AA)
- **File:** apps/demo/before/app/dashboard/page.tsx:9:7
- **Status:** confirmed
- **Source:** static
- **Message:** Clickable target is 20×20 CSS pixels, under the 24px minimum.
- **Who is affected:** People with limited precision, tremors, or who tap on a phone have a harder time hitting the control.

```tsx
<button type="button" className="size-5">
```

**Fix:** Raise the fixed size to at least 24px (size-6, h-6 w-6) or add padding that brings the target to 24px.

```diff
--- a/apps/demo/before/app/dashboard/page.tsx	
+++ b/apps/demo/before/app/dashboard/page.tsx	
@@ -1,1 +1,1 @@
-      <button type="button" className="size-5">
+      <button type="button" className="size-6">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#target-size

### A11Y-0008 target-size

- **WCAG:** 2.5.8 Target Size (Minimum) (AA)
- **File:** apps/demo/before/app/dashboard/page.tsx:12:7
- **Status:** confirmed
- **Source:** static
- **Message:** Clickable target is 16×16 CSS pixels, under the 24px minimum.
- **Who is affected:** People with limited precision, tremors, or who tap on a phone have a harder time hitting the control.

```tsx
<a href="/projects/1/edit" className="h-4 w-4">
```

**Fix:** Raise the fixed size to at least 24px (size-6, h-6 w-6) or add padding that brings the target to 24px.

```diff
--- a/apps/demo/before/app/dashboard/page.tsx	
+++ b/apps/demo/before/app/dashboard/page.tsx	
@@ -1,1 +1,1 @@
-      <a href="/projects/1/edit" className="h-4 w-4">
+      <a href="/projects/1/edit" className="h-6 w-6">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#target-size

### A11Y-0009 html-lang

- **WCAG:** 3.1.1 Language of Page (A)
- **File:** apps/demo/before/app/layout.tsx:8:5
- **Status:** confirmed
- **Source:** static
- **Message:** <html> is missing a lang attribute.
- **Who is affected:** Screen readers may pronounce the page in the wrong language.

```tsx
<html>
```

**Fix:** Set lang on <html>, for example <html lang="en">.

```diff
--- a/apps/demo/before/app/layout.tsx	
+++ b/apps/demo/before/app/layout.tsx	
@@ -1,1 +1,1 @@
-    <html>
+    <html lang="en">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#html-lang

### A11Y-0010 img-alt

- **WCAG:** 1.1.1 Non-text Content (A)
- **File:** apps/demo/before/app/page.tsx:13:7
- **Status:** confirmed
- **Source:** static
- **Message:** Image alt is a filename ("banner.png"), not a description.
- **Who is affected:** Screen reader users hear a filename instead of a description.

```tsx
<img src="/banner.png" alt="banner.png" />
```

**Fix:** Replace the filename alt with a short description of the image.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <img src="/banner.png" alt="banner.png" />
+      <img src="/banner.png" alt="Describe this image" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#img-alt

### A11Y-0011 img-alt

- **WCAG:** 1.1.1 Non-text Content (A)
- **File:** apps/demo/before/app/page.tsx:14:7
- **Status:** confirmed
- **Source:** static
- **Message:** Image alt is a generic word ("image"), not a description.
- **Who is affected:** Screen reader users hear a generic word instead of what the image shows.

```tsx
<Image src="/photo.jpg" alt="image" width={960} height={540} />
```

**Fix:** Replace the generic alt with a short description of the image.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <Image src="/photo.jpg" alt="image" width={960} height={540} />
+      <Image src="/photo.jpg" alt="Describe this image" width={960} height={540} />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#img-alt

### A11Y-0012 focus-visible-removed

- **WCAG:** 2.4.7 Focus Visible (AA)
- **File:** apps/demo/before/app/page.tsx:16:7
- **Status:** confirmed
- **Source:** static
- **Message:** Focus outline is removed without a focus-visible:ring or focus-visible:outline replacement.
- **Who is affected:** Keyboard users cannot see which element has focus.

```tsx
<button className="outline-none">Get started</button>
```

**Fix:** Add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2, or another focus-visible outline.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <button className="outline-none">Get started</button>
+      <button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none">Get started</button>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#focus-visible-removed

### A11Y-0013 link-name

- **WCAG:** 2.4.4 Link Purpose (In Context) (A)
- **File:** apps/demo/before/app/page.tsx:19:7
- **Status:** confirmed
- **Source:** static
- **Message:** Icon-only link has no accessible name.
- **Who is affected:** Screen reader users hear a link with no useful destination when links are read out of context.

```tsx
<Link href="/settings">
```

**Fix:** Add an aria-label or a <span className="sr-only"> that names the destination.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <Link href="/settings">
+      <Link aria-label="Describe the destination" href="/settings">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#link-name

### A11Y-0014 form-label

- **WCAG:** 1.3.1 Info and Relationships (A); 3.3.2 Labels or Instructions (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/register/page.tsx:11:7
- **Status:** confirmed
- **Source:** static
- **Message:** Form control has no label. Placeholder text is not a label.
- **Who is affected:** Screen reader users are not told what to enter. A placeholder disappears while typing and is not a label.

```tsx
<Input placeholder="Email" />
```

**Fix:** Add a Label with htmlFor matching the control id, aria-label, or a FormLabel inside the same FormItem.

```diff
--- a/apps/demo/before/app/register/page.tsx	
+++ b/apps/demo/before/app/register/page.tsx	
@@ -1,1 +1,2 @@
-      <Input placeholder="Email" />
+<Label htmlFor="email">Email</Label>
+      <Input id="email" placeholder="Email" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#form-label

### A11Y-0015 form-label

- **WCAG:** 1.3.1 Info and Relationships (A); 3.3.2 Labels or Instructions (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/register/page.tsx:12:7
- **Status:** confirmed
- **Source:** static
- **Message:** Form control has no label. Placeholder text is not a label.
- **Who is affected:** Screen reader users are not told what to enter. A placeholder disappears while typing and is not a label.

```tsx
<Input placeholder="Password" type="password" />
```

**Fix:** Add a Label with htmlFor matching the control id, aria-label, or a FormLabel inside the same FormItem.

```diff
--- a/apps/demo/before/app/register/page.tsx	
+++ b/apps/demo/before/app/register/page.tsx	
@@ -1,1 +1,2 @@
-      <Input placeholder="Password" type="password" />
+<Label htmlFor="password">Password</Label>
+      <Input id="password" placeholder="Password" type="password" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#form-label

### A11Y-0016 form-label

- **WCAG:** 1.3.1 Info and Relationships (A); 3.3.2 Labels or Instructions (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/register/page.tsx:13:7
- **Status:** confirmed
- **Source:** static
- **Message:** Form control has no label. Placeholder text is not a label.
- **Who is affected:** Screen reader users are not told what to enter. A placeholder disappears while typing and is not a label.

```tsx
<Textarea placeholder="About you" />
```

**Fix:** Add a Label with htmlFor matching the control id, aria-label, or a FormLabel inside the same FormItem.

```diff
--- a/apps/demo/before/app/register/page.tsx	
+++ b/apps/demo/before/app/register/page.tsx	
@@ -1,1 +1,2 @@
-      <Textarea placeholder="About you" />
+<Label htmlFor="about-you">About you</Label>
+      <Textarea id="about-you" placeholder="About you" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#form-label

### A11Y-0017 form-label

- **WCAG:** 1.3.1 Info and Relationships (A); 3.3.2 Labels or Instructions (A); 4.1.2 Name, Role, Value (A)
- **File:** apps/demo/before/app/register/page.tsx:14:7
- **Status:** confirmed
- **Source:** static
- **Message:** Form control has no label. Placeholder text is not a label.
- **Who is affected:** Screen reader users are not told what to enter. A placeholder disappears while typing and is not a label.

```tsx
<Checkbox />
```

**Fix:** Add a Label with htmlFor matching the control id, aria-label, or a FormLabel inside the same FormItem.

```diff
--- a/apps/demo/before/app/register/page.tsx	
+++ b/apps/demo/before/app/register/page.tsx	
@@ -1,1 +1,2 @@
-      <Checkbox />
+<Label htmlFor="label">Label</Label>
+      <Checkbox id="label" />
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#form-label

### A11Y-0018 dialog-title

- **WCAG:** 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A)
- **File:** apps/demo/before/components/delete-dialog.tsx:9:7
- **Status:** confirmed
- **Source:** static
- **Message:** DialogContent has no DialogTitle.
- **Who is affected:** Screen reader users are not told which dialog opened.

```tsx
<DialogContent>
```

**Fix:** Add DialogTitle, AlertDialogTitle, SheetTitle, or DrawerTitle. Wrap it in VisuallyHidden if it should not be shown.

```diff
--- a/apps/demo/before/components/delete-dialog.tsx	
+++ b/apps/demo/before/components/delete-dialog.tsx	
@@ -1,1 +1,3 @@
       <DialogContent>
+<DialogTitle>Describe this dialog</DialogTitle>
+<DialogDescription>Explain the purpose of this dialog.</DialogDescription>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#dialog-title

### A11Y-0019 focus-visible-removed

- **WCAG:** 2.4.7 Focus Visible (AA)
- **File:** apps/demo/before/components/header.tsx:8:7
- **Status:** confirmed
- **Source:** static
- **Message:** Focus outline is removed without a focus-visible:ring or focus-visible:outline replacement.
- **Who is affected:** Keyboard users cannot see which element has focus.

```tsx
<Link href="/" className="focus:outline-none">
```

**Fix:** Add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2, or another focus-visible outline.

```diff
--- a/apps/demo/before/components/header.tsx	
+++ b/apps/demo/before/components/header.tsx	
@@ -1,1 +1,1 @@
-      <Link href="/" className="focus:outline-none">
+      <Link href="/" className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#focus-visible-removed

### A11Y-0020 target-size

- **WCAG:** 2.5.8 Target Size (Minimum) (AA)
- **File:** apps/demo/before/components/header.tsx:11:7
- **Status:** confirmed
- **Source:** static
- **Message:** Clickable target is 20×20 CSS pixels, under the 24px minimum.
- **Who is affected:** People with limited precision, tremors, or who tap on a phone have a harder time hitting the control.

```tsx
<Button size="icon" className="size-5">
```

**Fix:** Raise the fixed size to at least 24px (size-6, h-6 w-6) or add padding that brings the target to 24px.

```diff
--- a/apps/demo/before/components/header.tsx	
+++ b/apps/demo/before/components/header.tsx	
@@ -1,1 +1,1 @@
-      <Button size="icon" className="size-5">
+      <Button size="icon" className="size-6">
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#target-size

## Moderate

### A11Y-0021 page-title

- **WCAG:** 2.4.2 Page Titled (A)
- **File:** apps/demo/before/app/page.tsx:6:1
- **Status:** confirmed
- **Source:** static
- **Message:** Page title "Harbor" is used by 2 routes.
- **Who is affected:** People using multiple tabs or a screen reader cannot tell these routes apart.

```tsx
export const metadata = { title: "Harbor" };
```

**Fix:** Give each route a title that names that specific page.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-export const metadata = { title: "Harbor" };
+export const metadata = { title: "Describe this page" };
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#page-title

### A11Y-0022 link-name

- **WCAG:** 2.4.4 Link Purpose (In Context) (A)
- **File:** apps/demo/before/app/page.tsx:18:7
- **Status:** confirmed
- **Source:** static
- **Message:** Link text "read more" does not describe its destination.
- **Who is affected:** Screen reader users hear a link with no useful destination when links are read out of context.

```tsx
<Link href="/blog/welcome">Read more</Link>
```

**Fix:** Replace the generic phrase with text that names the destination.

```diff
--- a/apps/demo/before/app/page.tsx	
+++ b/apps/demo/before/app/page.tsx	
@@ -1,1 +1,1 @@
-      <Link href="/blog/welcome">Read more</Link>
+      <Link href="/blog/welcome">Describe the destination</Link>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#link-name

### A11Y-0023 page-title

- **WCAG:** 2.4.2 Page Titled (A)
- **File:** apps/demo/before/app/register/page.tsx:5:1
- **Status:** confirmed
- **Source:** static
- **Message:** Page title "Harbor" is used by 2 routes.
- **Who is affected:** People using multiple tabs or a screen reader cannot tell these routes apart.

```tsx
export const metadata = { title: "Harbor" };
```

**Fix:** Give each route a title that names that specific page.

```diff
--- a/apps/demo/before/app/register/page.tsx	
+++ b/apps/demo/before/app/register/page.tsx	
@@ -1,1 +1,1 @@
-export const metadata = { title: "Harbor" };
+export const metadata = { title: "Describe this page" };
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#page-title

### A11Y-0024 dialog-title

- **WCAG:** 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A)
- **File:** apps/demo/before/components/delete-dialog.tsx:9:7
- **Status:** confirmed
- **Source:** static
- **Message:** DialogContent has no DialogDescription.
- **Who is affected:** Screen reader users may not hear what the dialog is for beyond its name.

```tsx
<DialogContent>
```

**Fix:** Add DialogDescription (or the matching Sheet, Drawer, or AlertDialog description).

```diff
--- a/apps/demo/before/components/delete-dialog.tsx	
+++ b/apps/demo/before/components/delete-dialog.tsx	
@@ -1,1 +1,2 @@
       <DialogContent>
+<DialogDescription>Explain the purpose of this dialog.</DialogDescription>
```

Docs: https://github.com/ZenenContreras/a11ycn/blob/main/skills/a11ycn/references/rules.md#dialog-title

## Manual checks

These are not decided by the static scan. Leave them as `todo` until a person checks them.

| Check | Status | Notes |
| --- | --- | --- |
| keyboard-only | todo | Complete the main task using only the keyboard. |
| focus-order | todo | Confirm tab order follows the visual order. |
| focus-trap-dialog | todo | Confirm focus stays inside an open dialog, sheet, or drawer. |
| escape-closes-dialog | todo | Confirm Escape closes the topmost dialog and restores focus. |
| meaningful-alt | todo | Confirm alt text describes the purpose of the image, not only that an attribute exists. |
| live-announcements | todo | Confirm status messages are announced without stealing focus. |
| focus-not-obscured | todo | Confirm sticky headers and footers do not cover the focused element. |
| zoom-reflow | todo | Confirm the page still works at 200% zoom. |

Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.
