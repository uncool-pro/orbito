---
name: ui-audit
description: UI audit of Orbito mockups after the UX designer — consistency with the design system, visual hierarchy, spacing rhythm, colour use, deviations from the norm and implementation quality. Use after a batch of screens is built, before showing screens to a client, or when someone asks to check whether screens are consistent.
---

# UI audit

**Role:** design auditor — the UI designer builds the design system and the screens, the auditor checks them with fresh eyes. The audit checks that what was built is built right, visually. It does not redesign flows and does not decide: the findings go to `design-decisions`.

## First the machine, then the eye
1. `npm run check:ds` — raw values, imports outside the design system, level order, undocumented components. Fix or report all errors first.
2. Then look at each screen (`#/s/<code>`) and on the board.

## What to check on each screen
- **Hierarchy:** the most important thing is the most prominent (size, weight, position); one primary action per area; secondary information visibly quieter.
- **Consistency:** the same thing looks and behaves the same everywhere (same component, same variant for the same role, same spacing between the same kinds of elements).
- **Rhythm and alignment:** spacing from the scale, consistent edges, nothing that is "almost" aligned.
- **Colour:** used for meaning (status, action), not decoration; status colours mean the same thing everywhere.
- **Deviations:** anything that does not follow the design system — either a mistake to fix or a new need to add to the system (with docs). Never leave a one-off.
- **Real content:** long names, empty and error states, many items — does it still hold?

## Report
A findings table in `reviews/<date>-ui-audit.md`: `| # | Severity | Screen | Finding | Proposal |`. Severity: high (breaks understanding or the system), medium (inconsistent), low (polish). Screens that need changes after review get a version that references the finding numbers.
