---
name: process-rapid-prototype
description: Orbito's process for a rapid prototype — a vertical slice: one happy path or the two main functions, cut through end to end and clickable, showing the client what we are building in a very reduced form. The business analyst analyses all the context and picks the features and the flow; the UX designer turns it into a user flow and lo-fi screens with real copy; a critical UX audit and fixes repeat until clean. Use when someone needs a prototype or concept "for a meeting", "to show the client", "quickly", or when a project starts as a rapid prototype.
---

# Process: rapid prototype

Run by **Orbito** (the lead). A rapid prototype is a **vertical slice**: a narrow functional cut through the product — one happy path, or the two main functions — that shows what we are building, in a very reduced form. It is functional first: a visual layer can go on top only when a look & feel exists (or the person brings a brand and asks for it). Not to be confused with lo-fi wireframes in general: wireframes are the stage of every design; a rapid prototype is a small, finished slice for one purpose.

## Steps
| # | Step | Role | Skill | Output | Gate |
|---|---|---|---|---|---|
| 1 | Analyse the context, pick the slice | business-analyst | prototype-scope | the features and the flow of the slice, its stories, the assumptions | **person says yes to the slice** |
| 2 | Functional or with UI? | orbito | process-rapid-prototype | the decision written in `.orbito/process.md` | **person decides** |
| 3 | User flow | ux-designer | user-flows | the happy flow of the slice, linked to its stories | — |
| 4 | Lo-fi screens with copy | ux-designer | wireframes | the screens of the slice with real interface words (`ux-writing`), clickable end to end | — |
| 5 | Critical UX audit | ux-designer | ux-review | findings: logic gaps, dead ends, unclear steps, missing states, copy | — |
| 6 | Fixes, then audit again | ux-designer | wireframes | fixes; steps 5–6 repeat until the audit finds nothing that matters | audit clean |
| 7 | UI on top (only if decided in step 2) | ui-designer | ui-design | the slice on the project's design system or the brand tokens | — |
| 8 | Ready to show | orbito | process-rapid-prototype | the walk-through, what was built and what was left out | **person accepts the prototype** |

## Step 1 — what the analyst works from
Everything there is in the context: transcripts of calls, offers for the client, functional requirements, notes, the brief. The analyst reads all of it, then decides which features and which flow make the slice (see `prototype-scope`), and says why.

## Step 2 — functional or with UI
Ask the person: stay functional (lo-fi, the fastest and the most honest about what is decided), or put a visual layer on top? A visual layer needs a look & feel: an approved one, the client's existing design system, or at least their brand. Without one, recommend functional.

## Steps 5–6 — the audit loop
The audit is done by the UX designer in auditor mode — ideally a separate agent run that did not build the screens, so it looks with fresh eyes — and is critical on purpose: it walks the slice as the persona and looks for logic gaps, steps that do not follow, missing states, dead ends, words that do not explain. Fix, audit again, until a round finds nothing that matters. Two or three rounds are normal; more means the slice is too big — say so.

## Step 8 — ready to show
- Click the first screen on the board (or open `#/s/<first screen>`) and walk the slice; the board shows it whole for discussion.
- Write in `.orbito/process.md`: what the slice shows, which stories it covers, what was deliberately left out, the assumptions still open.
- Changes after the meeting go into a version of the flow so the original stays for comparison.
- **Later (not in this version):** a narrated demo video of the prototype, for the person who presents it or sends it to the client — what was built and which functions it shows. When the demo skill exists, Orbito will ask here whether to make one.

## Quality bar
- The whole slice is clickable and tells a story without explanation.
- Every assumption is written down and confirmed or marked as open.
- Small: past ~10 screens it is not a rapid prototype anymore — say so and propose `process-new-product`.
