# Orbito skills and agents

Skills package the product design process of Orbito: what good work looks like at each stage, how to check it, and when to hand over. They are written as principles, criteria and examples, not as step-by-step scripts, so they work with any capable model. `npm create orbito` copies them into a project's `.claude/skills/` and the agents into `.claude/agents/`.

## Roles (agents) and the skills they use

| Agent | Role | Skills | Model tier |
|---|---|---|---|
| main session — **Orbito** | the lead (orchestrator) people talk to: builds the project strategy, knows where the project stands, routes each request to the right role, proposes and questions, asks people for decisions, keeps `.orbito/process.md` | orbito, orbito-workspace, project-kickoff, product-feedback | strongest |
| `business-analyst` | functional requirements (user stories) from the client; syncs them with approved mockups; scopes rapid prototypes (1–2 happy paths) | requirements, rapid-prototyping | build |
| `ux-designer` | information architecture, flows (happy, alternative, negative), screen specs; challenges stories; defends or accepts findings | ux-design | strongest |
| `prototyper` | builds screens and components from specs, on the lo-fi kit or the project design system | ux-design (mockups), design-system | build |
| `ui-designer` | look & feel (5 variants), the project design system, UI audit after UX | look-and-feel, design-system, ui-audit | build |
| `design-auditor` | frequent checks after each stage: UI consistency, accessibility (WCAG AA) | ui-audit, accessibility-audit | light |
| `synthetic-user` | one persona looking at screens and saying what is unclear | synthetic-usability | light |
| `copywriter` | research in the audience's words, the value proposition and the sales copy of landing and product pages | sales-copy, landing-page | strongest |

Model tiers are set in each agent's `model` field and nowhere else. Rule of thumb: thinking about the product (architecture, flows, decisions) → strongest; building → build tier; repeated checks and personas → light. Anything code can check (design-system rules, links, dead ends, contrast) is checked by code, not by a model.

## The process (greenfield)

```
kickoff ──► requirements (BA) ──► IA ► flows ► screen specs (UX) ──► lo-fi mockups (prototyper)
                                      ▲  corrective audits after every stage (design-auditor)
person reviews ─► version (branch) ─► BA + client approve ─► BA syncs stories with the approved mockups
look & feel: 5 variants (UI) ─► client picks ─► project design system (UI) ─► new screens hi-fi
UI audit ─► accessibility audit ─► synthetic users ─► UX defends or fixes ─► person decides
```

Landing pages have their own path (`landing-page`): funnel of sections (UX) → copy (`sales-copy`, copywriter) → lo-fi page → look & feel for pages → hi-fi → five-second test with personas → `npm run export`, a static site the person publishes.

Existing products start from sources (code, Figma, documents) instead of look & feel. Quick prototypes: the business analyst picks the 1–2 happy paths that show the concept best, then UX and the prototyper build only those (`rapid-prototyping`). Any part can be started on its own; the lead (`orbito`) works out what is missing and what to ask.

Throughout: anonymous notes about Orbito itself go to `feedback.md` (`product-feedback`), for the person to review and send to orbito@uncool.pro.

## Status
Beta 0.9 skills. Planned: product demo, the full rapid-prototyping process from practice, discovery, research (interviews and synthesis), product analytics; a lighter orchestrator on a local model.
