---
name: process-redesign
description: Orbito's process for an existing product or page — audit what exists, extract requirements and the design system from it, agree a keep / fix / redo list with the person, then design only the changes as versions next to the current state. Use when the person brings screens, an app, a page or a design system that already exists and wants it improved or redesigned.
---

# Process: redesign (existing product or page)

Run by **Orbito** (the lead), following `orbito` → "Start from what exists". Nothing is designed from scratch that already works.

## Steps
| # | Step | Role | Skill | Output | Gate |
|---|---|---|---|---|---|
| 1 | Sort what the person brought | orbito | project-kickoff | `.orbito/sources.md` from `raw/` | person confirms the distribution |
| 2 | Requirements from what exists | business-analyst | user-stories | stories describing current behaviour | person confirms gaps |
| 3 | Design system from what exists | ui-designer | design-system | tokens and components rebuilt "as they are" | `check:ds` clean |
| 4 | Current screens rebuilt | ux-designer | wireframes | the current flows, as they are | — |
| 5 | Audit of the current state | design-auditor | ui-audit | findings on the current state | — |
| 6 | Accessibility of the current state | design-auditor | accessibility-audit | findings on the current state | — |
| 7 | Keep / fix / redo | orbito | ux-review | a list per part, with reasons | **person approves the list** |
| 8 | Changes to paths | ux-designer | user-flows | changed flows as versions | UX review |
| 9 | Changed screens | ux-designer | wireframes | changed screens in versions | UX review |
| 10 | Review with the client | orbito | ux-review | approved versions | **client and BA approve** |
| 11 | Stories follow the mockups | business-analyst | requirements-sync | stories and tests updated | done before development |

## Notes
- The current state stays on the board as the original; every change is a version next to it, so people compare before and after.
- When the visual direction itself changes, insert `look-and-feel` (ui-designer) before step 9 and `ui-design` after it.
