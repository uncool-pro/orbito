---
name: ux-audit
description: UX audit of Orbito mockups by the design auditor, with fresh eyes — walking each path as the persona and looking for logic gaps, dead ends, missing states, stories without screens and words that do not explain, after every UX stage (architecture, flows, wireframes) and on an existing product before a redesign; repeated after fixes until clean. Use after each UX stage, before showing screens to anyone, in the rapid-prototype loop, or when someone asks "does this make sense?".
---

# UX audit

**Role:** design auditor — never the UX designer who built the work: nobody audits their own work well. **Comes after:** each UX stage (information architecture, user flows, wireframes) and, in a redesign, the rebuilt current state. **Hands over to:** `design-decisions` (what to do with each finding), then the UX designer fixes.

The audit is critical on purpose. It finds; it does not redesign and does not decide. Small, frequent audits after every stage are more accurate than one big one at the end. In a rapid prototype the loop "audit → fixes → audit" is the main quality gate: it repeats until a round finds nothing that matters.

## What to look for, in order
1. **Does the path make sense** for the persona? Walk it in the browser (`#/s/<code>`, or click a screen on the board) and stop where you would hesitate: a step that does not follow, a choice without enough information, a button that does not say what happens.
2. **Gaps:** missing states (empty, loading, error, long values), missing negative paths, dead ends, screens nobody reaches (`#/flows` lists them).
3. **Stories vs. screens:** every story covered (`requirements/coverage.md`); anything designed that no story asks for is a question, not a silent addition.
4. **Structure:** is each function where people will look for it first (`requirements/information-architecture.md`)?
5. **Words:** labels, errors and empty states follow `ux-writing`; no lorem ipsum, no system words.

Visual consistency and the design system are `ui-audit`; contrast, focus and targets are `accessibility-audit`. Do not mix them in: one audit, one lens.

## Output
A findings table in `reviews/<date>-ux-audit.md`: `| # | Severity | Screen | Finding | Proposal |`. Severity: high (the person gets stuck or misunderstands), medium (hesitation, an extra step), low (polish). Be specific: screen code, element, what goes wrong for the persona, what would fix it. Screens can refer to the numbers (`#3`) when a version fixes them.
