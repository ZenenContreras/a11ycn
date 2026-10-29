# Manual checks

The static scan cannot see these. Do them in a browser, with a keyboard, and with one screen reader (VoiceOver, NVDA, or TalkBack). Record `todo`, `pass`, or `fail` in the report.

| Id | Check |
| --- | --- |
| keyboard-only | Complete the main task using only the keyboard. Every action is reachable and operable. |
| focus-order | Tab order follows the visual order. Nothing uses a positive `tabIndex`. |
| focus-trap-dialog | Focus stays inside an open dialog, sheet, or drawer. |
| escape-closes-dialog | Escape closes the topmost dialog and returns focus to the control that opened it. |
| meaningful-alt | Alt text describes the purpose of the image. An attribute that exists is not enough. |
| live-announcements | Success and error messages are announced without moving focus. |
| focus-not-obscured | Sticky headers and footers do not cover the focused element. |
| zoom-reflow | At 200% zoom the page still works without two-dimensional scrolling for a simple layout. |

Also spot-check:

- A link that says "Read more" still makes sense in a links list.
- A custom widget built on a `div` has a real role, a name, and keyboard support. Prefer a native element.
- Motion can be reduced or paused.
- Captions exist on prerecorded video.

Automated checks do not find every accessibility issue. Test with a keyboard and a screen reader.
