# Orbito skills and agents

Skills package the product design process of Orbito: what good work looks like at each stage, how to check it, and when to hand over. They are written as principles, criteria and examples, not as step-by-step scripts, so they work with any capable model. `npm create orbito` copies them into a project's `.claude/skills/` and the agents into `.claude/agents/`; `orbito update` refreshes them. The skills map in Orbito (`#/skills`) shows the same structure.

## Three layers

1. **Orbito, the lead** (the main session, strongest model) — talks to the person, writes the project strategy, picks and adapts a process, routes work to the roles, asks for decisions. Skills: `orbito`, `orbito-workspace`, `project-kickoff`, `product-feedback`.
2. **Processes** Orbito runs (`process-*`) — the recommended path for a kind of project; each has a **Steps** table: step · role · competence · output · gate (where the person decides).
3. **Roles and their competences** — agents, each preloading its own skills (`skills:` in the agent file).

## Processes

| Process | For |
|---|---|
| `process-new-product` | a new product (greenfield): stories → IA → flows → lo-fi → review and sync → look & feel → design system → hi-fi → audits → synthetic users |
| `process-redesign` | something that exists: sort and audit it → keep / fix / redo → changes as versions → sync |
| `process-rapid-prototype` | a vertical slice for a client: the analyst picks 1–2 happy paths, UX builds them lo-fi with copy, a critical UX audit loops until clean; UI on top only with a look & feel |
| `process-landing-page` | a landing page that is both the mockup and the site: funnel → value proposition (BA) → page copy (UX) → lo-fi → look & feel → hi-fi → checks → static export |

## Roles and competences

| Agent | Model tier | Competences (skills) |
|---|---|---|
| `business-analyst` | build | `user-stories` (check, complete or write epics and stories with acceptance criteria) · `value-proposition` (audience, values, proof, personas) · `prototype-scope` · `requirements-sync` (stories follow approved mockups and the tracker) |
| `ux-designer` | strongest | `information-architecture` · `user-flows` (built from the stories and linked to them) · `wireframes` (designed and built in code) · `ux-writing` · `page-copy` · `ux-review` (critical, in auditor mode) |
| `ui-designer` | build | `look-and-feel` · `design-system` · `ui-design` (hi-fi screens) · `ui-audit` |
| `design-auditor` | light | `ui-audit` · `accessibility-audit` |
| `synthetic-user` | light | one persona inside `synthetic-usability` (run by Orbito and the UX designer) |

Model tiers are set in each agent's `model` and `effort` fields — the values in this repository are the **optimal** mode. A project can switch to the **high** mode (`orbito models high`: the strongest model with high effort for the analyst, UX and UI; the middle one with high effort for the auditor and personas), stored in `.orbito/settings.json` and kept by `orbito update`. Rule of thumb: thinking about the product (architecture, flows, decisions) → strongest; building → build tier; repeated checks and personas → light. Anything code can check (design-system rules, links, dead ends, contrast) is checked by code, not by a model.

## How the layers meet
- A request for one competence ("do the information architecture") goes straight to its role; no process needed.
- A project gets a process in Orbito's strategy (`.orbito/process.md`), adapted to what already exists (`orbito` → "Start from what exists").
- The analyst's stories are the UX designer's input: UX builds the flows and screens from them and links the stories to both (`requirements/`, `meta.requirements`, the flow's `requirements`). After the client approves, the analyst updates the stories to match the mockups.

Throughout: anonymous notes about Orbito itself go to `feedback.md` (`product-feedback`), for the person to review and send to orbito@uncool.pro.

## Status
Beta 0.9 skills. Planned: product demo, discovery and research (interviews and synthesis), product analytics; a lighter orchestrator on a local model.
