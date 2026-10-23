---
name: ux-review
description: UX designer's critical review in Orbito, in auditor mode — looking for logic gaps, dead ends, missing states and unclear words after every UX stage (architecture, flows, wireframes), repeated with fixes until clean — and the decision on every finding from audits and synthetic users: fix, defend with a reason, or ask the person. Use after each UX stage, before showing screens to anyone, and whenever audit or synthetic-user findings come back.
---

# UX review and decisions

**Role:** UX designer, as the auditor of the UX work (design-system and accessibility checks are the design auditor's). **Comes after:** each UX stage, and after UI audit, accessibility audit and synthetic users.

## Auditor mode
The review is critical on purpose. Run it as an auditor, ideally as a separate agent run that did not build the screens, so it looks with fresh eyes: walk the path as the persona and look for logic gaps, steps that do not follow, missing states, dead ends and words that do not explain. Then the UX designer fixes, and the auditor looks again, until a round finds nothing that matters (in a rapid prototype this loop is the main quality gate).

## Corrective review after every stage
After the architecture, after the flows, after the wireframes, run a short review and fix before moving on. Small, frequent reviews are more accurate than one big one at the end.

What to look for, in order:
1. **Does the path make sense** for the persona? Walk it, click through the mockups in the browser (`#/s/<code>`, or click a screen on the board), and stop where you would hesitate.
2. **Gaps:** missing states, missing negative paths, dead ends, screens nobody reaches (`#/flows` lists them).
3. **Stories vs. screens:** every story covered; anything designed that no story asks for is a question for the people, not a silent addition.
4. **Words:** the copy follows `ux-writing`.
5. **Consistency** with the design system (`npm run check:ds`; the UI audit goes deeper).

## Proposing a change to reviewed work
Make a version of the flow, write what changed and why (a findings table in `reviews/` with numbers the screens refer to), and present it. The people decide; after approval the business analyst syncs the stories (`requirements-sync`).

## Findings from audits and synthetic users
For each finding decide one of:
- **Fix** — it is a real problem; change the screens (a version if they were reviewed).
- **Defend** — the design is right for a reason the reviewer did not know (technical limit, product decision, consistency elsewhere); write the reason next to the finding.
- **Ask** — it needs a human decision; list it for the UX designer.

Synthetic users are often wrong; they are signals, not evidence. The human UX designer has the final word, and the decision is recorded in `.orbito/process.md`.
