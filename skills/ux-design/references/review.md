# Review and decisions

## Corrective review after every stage
After the architecture, after the flows, after the specs and after the mockups, run a short review (the `design-auditor` agent does the repeated parts) and fix before moving on. Small, frequent reviews are more accurate than one big one at the end.

What to look for, in order:
1. **Does the path make sense** for the persona? Walk it, click through the mockups in the browser (`#/s/<code>`), and stop where you would hesitate.
2. **Gaps:** missing states, missing negative paths, dead ends, screens nobody reaches (`#/flows` lists them).
3. **Stories vs. screens:** every story covered; anything designed that no story asks for is a question for the people, not a silent addition.
4. **Consistency** with the design system (`npm run check:ds`; the UI audit goes deeper).

## Proposing a change to reviewed work
Make a version of the flow, write what changed and why (a findings table in `reviews/` with numbers the screens refer to), and present it. The people decide; after approval the business analyst syncs the stories.

## Findings from audits and synthetic users
For each finding decide one of:
- **Fix** — it is a real problem; change the screens (a version if they were reviewed).
- **Defend** — the design is right for a reason the reviewer did not know (technical limit, product decision, consistency elsewhere); write the reason next to the finding.
- **Ask** — it needs a human decision; list it for the UX designer.

Synthetic users are often wrong; they are signals, not evidence. The human UX designer has the final word, and the decision is recorded in `.orbito/process.md`.
