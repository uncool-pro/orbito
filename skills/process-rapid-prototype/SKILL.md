---
name: process-rapid-prototype
description: Orbito's process for a quick, clickable prototype that shows a client what we are about to build — the business analyst picks the one or two happy paths that show the concept best, UX turns them into flows and screens, the look follows the brand if there is one, and the whole path is clickable for the meeting. Use when someone needs a prototype or concept "for a meeting", "to show the client", "quickly", or when a project starts as a quick prototype.
---

# Process: rapid prototype

Run by **Orbito** (the lead). A rapid prototype answers one question for the client: *is this what we are building?* It is not the full design: the main idea on the smallest set of screens that makes it clear, clickable in the browser.

## Steps
| # | Step | Role | Skill | Output | Gate |
|---|---|---|---|---|---|
| 1 | What to show | business-analyst | prototype-scope | 1–2 happy paths, screens per path, assumptions | **person says yes to the scope** |
| 2 | Paths | ux-designer | user-flows | one happy flow per chosen path, linked to its story | — |
| 3 | Screens | ux-designer | wireframes | 3–7 screens per path with real copy (`ux-writing`) | path clickable end to end |
| 4 | The look (optional) | ui-designer | design-system | brand tokens on the base kit, when the client expects the look | — |
| 5 | Walk-through | orbito | ux-review | the path walked as the persona, dead ends fixed | `#/flows` clean |
| 6 | Show it | orbito | process-rapid-prototype | the meeting: what was said, what was decided | **client decides what next** |

## Rules
- Skip alternative and negative paths unless the client asked about a specific failure.
- Lo-fi kit unless a design system or brand already exists and the client expects the look (step 4).
- Real, believable content (fictional names and data, realistic lengths). Placeholder text kills a prototype.
- Every step clickable from start to finish in prototype mode (click the first screen on the board, or `#/s/<first screen>`).

## Show it (step 6)
- Open the first screen in prototype mode and walk the path; the board shows the whole path at once for discussion.
- Collect what the client says; changes go into a version of the flow so the original stays for comparison.
- Record in `.orbito/process.md`: what was shown, to whom, what was decided, what is next (the full process `process-new-product`, another iteration, or stop).

## Quality bar
- The whole path is clickable and tells a story without explanation.
- Every assumption the analyst made is written down and was either confirmed or marked as open.
- Small: past ~10 screens it is not a rapid prototype anymore — say so and propose the full process.
