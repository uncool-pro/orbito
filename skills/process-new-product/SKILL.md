---
name: process-new-product
description: Orbito's full design process for a new product (greenfield) — user stories, information architecture, user flows, lo-fi wireframes, review with the client and requirements sync, look & feel, design system, hi-fi screens, audits and synthetic users — with who does each step and where the person decides. Use when the kickoff says the project is a new product, or when someone asks for "the whole process" or "where are we".
---

# Process: new product

Run by **Orbito** (the lead). Each step names the role (agent) and the competence (skill) it uses, what it produces and the gate before the next step. The person can start anywhere and skip steps; Orbito says what an earlier step would have added (`orbito` → "Start from what exists").

## Steps
| # | Step | Role | Skill | Output | Gate |
|---|---|---|---|---|---|
| 1 | Kickoff and sources | orbito | project-kickoff | `.orbito/process.md`, `.orbito/sources.md` | person confirms the plan |
| 2 | Requirements | business-analyst | user-stories | what the person brought, checked and completed: epics and stories in `requirements/` | stories ready (definition of ready) |
| 3 | Navigation and structure | ux-designer | information-architecture | `requirements/information-architecture.md` | UX review |
| 4 | Paths | ux-designer | user-flows | flows (happy, alternative, negative) built from the stories and linked to them; `requirements/coverage.md` | UX review; gaps listed for the person and the analyst |
| 5 | Screens (lo-fi) | ux-designer | wireframes | lo-fi screens with real copy (`ux-writing`) | UX review, `#/flows` clean |
| 6 | Review with the client | orbito | ux-review | an approved version of the flows | **client and BA approve** |
| 7 | Stories follow the mockups | business-analyst | requirements-sync | stories and tests updated | done before development |
| 8 | Visual direction | ui-designer | look-and-feel | five variants of one flow; after the choice only the chosen one stays | **client picks a direction**, agrees to remove the others |
| 9 | Design system | ui-designer | design-system | tokens, components, docs; `check:ds` clean | person approves the system |
| 10 | Screens (hi-fi) | ui-designer | ui-design | lo-fi screens migrated, new ones in hi-fi | — |
| 11 | Consistency | design-auditor | ui-audit | `reviews/…-ui-audit.md` | findings decided (`ux-review`) |
| 12 | Accessibility | design-auditor | accessibility-audit | `reviews/…-accessibility.md` | high findings fixed |
| 13 | Would people understand it? | synthetic-user | synthetic-usability | signals per screen | UX fixes, defends or asks |

## Notes
- From step 9 on, the UX designer builds new screens straight on the design system (hi-fi); the lo-fi kit is a temporary, earlier cost.
- Every change to approved screens is a version of the flow; after approval, step 7 runs again for the stories it touches.
- Steps 11–13 repeat after each larger batch of screens, not once at the end.
