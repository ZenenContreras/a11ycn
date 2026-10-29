import type { ManualCheck } from "./types.js";

export const MANUAL_CHECKS: ManualCheck[] = [
  {
    id: "keyboard-only",
    status: "todo",
    notes: "Complete the main task using only the keyboard.",
  },
  {
    id: "focus-order",
    status: "todo",
    notes: "Confirm tab order follows the visual order.",
  },
  {
    id: "focus-trap-dialog",
    status: "todo",
    notes: "Confirm focus stays inside an open dialog, sheet, or drawer.",
  },
  {
    id: "escape-closes-dialog",
    status: "todo",
    notes: "Confirm Escape closes the topmost dialog and restores focus.",
  },
  {
    id: "meaningful-alt",
    status: "todo",
    notes: "Confirm alt text describes the purpose of the image, not only that an attribute exists.",
  },
  {
    id: "live-announcements",
    status: "todo",
    notes: "Confirm status messages are announced without stealing focus.",
  },
  {
    id: "focus-not-obscured",
    status: "todo",
    notes: "Confirm sticky headers and footers do not cover the focused element.",
  },
  {
    id: "zoom-reflow",
    status: "todo",
    notes: "Confirm the page still works at 200% zoom.",
  },
];
