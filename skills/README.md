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

| Agent | Model (optimal) | Competences (skills) |
|---|---|---|
| `business-analyst` | Opus medium (`value-proposition`: Opus high) | `user-stories` (check, complete or write epics and stories with acceptance criteria) · `value-proposition` (audience, values, proof, personas) · `prototype-scope` · `requirements-sync` (stories follow approved mockups and the tracker) |
| `ux-designer` | Opus high | `information-architecture` · `user-flows` (built from the stories and linked to them) · `wireframes` (designed and built in code) · `ux-writing` · `page-copy` |
| `ui-designer` | Opus medium (`look-and-feel`: Opus high) | `look-and-feel` · `design-system` · `ui-design` (hi-fi screens) |
| `design-auditor` | Opus medium | `ux-audit` · `ui-audit` · `accessibility-audit` — every audit, never by the role that built the work |
| `synthetic-user` | Sonnet high | one persona inside `synthetic-usability` (run by Orbito and the UX designer) |

Model tiers are set in each agent's `model` and `effort` fields — the values in this repository are the **optimal** mode. The two modes are profiles in `agents/models.json` (copied to a project's `.orbito/models.json`): **optimal** (the agent files' own values) and **high** (Opus everywhere, one effort step up, very high where the work is strategic). The mode is personal — `orbito models high` saves it in `.orbito/settings.local.json`, git-ignored; `--team` sets the team's default in `.orbito/settings.json` — and Orbito passes the profile's model and effort each time it calls an agent, so agent files never change. A competence that needs more than the rest of its role's work gets its own line, `<role>/<skill>`. The floor and the steps: **Sonnet high** is the lowest anything runs on, and only for work that is repeated or run many times in parallel (synthetic personas); **Opus medium** is the default for the work itself; **Opus high** for strategic decisions made once that everything after builds on (the lead, information architecture and flows, the value proposition, look & feel) — **very high** (`xhigh`) for these in the high mode. Anything code can check (design-system rules, links, dead ends, contrast) is checked by code, not by a model.

## How the layers meet
- A request for one competence ("do the information architecture") goes straight to its role; no process needed.
- A project gets a process in Orbito's strategy (`.orbito/process.md`), adapted to what already exists (`orbito` → "Start from what exists").
- The analyst's stories are the UX designer's input: UX builds the flows and screens from them and links the stories to both (`requirements/`, `meta.requirements`, the flow's `requirements`). After the client approves, the analyst updates the stories to match the mockups.

Throughout: anonymous notes about Orbito itself go to `feedback.md` (`product-feedback`), for the person to review and send to orbito@uncool.pro.

## Status
Beta 0.9 skills. Planned: product demo, discovery and research (interviews and synthesis), product analytics; a lighter orchestrator on a local model.
