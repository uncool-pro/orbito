---
name: accessibility-audit
description: Accessibility audit (WCAG 2.2, target level AA) of Orbito mockups and the design system — contrast, touch targets, labels, focus and reading order, text alternatives, motion. Mandatory before screens go to a client. Use after the UI audit, when the design system changes, or when someone asks about accessibility or WCAG.
---

# Accessibility audit

Target: **WCAG 2.2 level AA**. Level A only when the product explicitly requires less, and that decision is written in `.orbito/process.md`. The UI designer designs for AA; this audit checks it independently, every time.

## Checked by code (no model needed)
- Contrast of every declared text/background token pair (`npm run check:ds`, rule `contrast`): 4.5:1 for text, 3:1 for large text and UI parts.
- Interactive elements come from the design system (which has labels and 44×44 targets).

## Checked by review, per screen
- **Perceivable:** every icon-only control has a label; images and media have a text alternative or are marked decorative; information is never carried by colour alone.
- **Operable:** touch targets at least 44×44 (24×24 minimum spacing on web); destructive actions can be undone or are confirmed; nothing depends on a gesture without an alternative; time limits can be extended.
- **Understandable:** clear labels above fields; errors say what happened and how to fix it; consistent navigation and naming across screens.
- **Robust:** components use the right roles (button, link, tab, dialog, switch, checkbox).
- **Motion:** essential information is not only in animation; respect reduced motion.

## Report
`reviews/<date>-accessibility.md`, table `| # | WCAG criterion | Screen | Finding | Fix |`. Findings in the design system are fixed there once; findings in screens get a version.
