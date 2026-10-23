---
name: orbito-workspace
description: How an Orbito project works — files, conventions, commands, the process file and the change → check → look loop. Use at the start of any work in an Orbito project (screens, flows, design system, statuses, versions) and whenever unsure where something belongs or who does what next.
---

# Working in an Orbito project

Orbito keeps a product's mockups as code and shows them as a board of flows, a flows diagram, single clickable screens and a design-system catalog. Mockups are not production code: fictional data, no backend, interactions drawn and clickable. People make the design decisions; agents build, check and keep everything consistent.

## Read first, every session
1. `.orbito/process.md` — the phase, what is approved (by whom, when), which sources exist, past decisions. If the kickoff is not done, run `project-kickoff` before building anything.
2. `orbito.config.ts` — product name, UI language, default viewport.

## Where things live
| What | Where | Notes |
|---|---|---|
| tokens | `design-system/tokens.json` | every value; each token has a `usage` note; text colours list the backgrounds they sit on (`on`) |
| components | `design-system/atoms → molecules → organisms → templates` | a level builds only on itself or lower; `<Name>.docs.tsx` next to each (description, do/don't, variants); exported from `design-system/index.ts` |
| screens | `screens/**/<id>.screen.tsx` | file name = id; `export const meta = defineScreen({ code, title, viewport?, back?, requirements? })`; codes (`AB-01`) never change |
| flows | `flows/*.flow.ts` | pages → flows (ordered screens) with `path: 'happy' \| 'alternative' \| 'negative'`; `versions` hold alternatives next to the original |
| raw material | `raw/` | everything the person brought, unsorted and left untouched; out of git by default; `.orbito/sources.md` lists what it holds and where each item was used |
| requirements | `requirements/*.md` | stories with ids (`REQ-01`), the local mirror of the team's tracker |
| reviews | `reviews/*.md` | findings tables (`\| # \| ... \|`) that versions point to |
| statuses | `.orbito/status.json` | set on the board, one per screen |
| model mode | `.orbito/settings.json` | `"models": "optimal"` or `"high"` — how the agents use models; switch with `npx orbito models <mode>` |
| page content | `content/*.md` | landing pages: the funnel of sections, the copy, the research (`process-landing-page`, `value-proposition`, `page-copy`) |
| fonts, pictures | `design-system/fonts.css`, `public/` | `@font-face` / `@import` for the typefaces the tokens name; files served as they are and copied by the export |

## Rules that are checked
- Screens are built only from the design system (`import … from '../../design-system'`): no raw `<button>`, `<a>`, `<input>`, no event handlers, no raw colours, spacing or fonts. Something missing? Add it to the design system first (right level, docs with variants), then use it.
- Links are declared where they are drawn: `to="<screen id>"` or `back` on a design-system component; a transition the person does not trigger (error, timeout, auto-return) is a `<Transition to on label />` from the runtime. Pages published as a static site use `href` instead (`#section-id` or a full address).
- A page meant to be published (a landing) is exported with `npm run export` (`site` in `orbito.config.ts`) into `site/`, a static folder for any host. Never publish or deploy it yourself.
- After every change: `npm run check:ds` (0 errors), `npm run typecheck`, then look at the board (`#/board`) and the flows diagram (`#/flows`): no dead ends, no unreachable screens, no flow step without a link.

## Changing reviewed work
A screen that someone already reviewed or approved is not edited silently. Make a **version** of the flow (`versions: [{ key, name, date, state: 'open', screens: [{ id, replaces }] }]`), build the new screens there, and let people compare. When the version is approved, record it in `.orbito/process.md` and hand over to `business-analyst` to sync the requirements.

## Who does what next (hand-offs)
The main session is Orbito, the lead: it uses the `orbito` skill to keep the strategy, decide who takes a request and what to ask the person. Any part of the process can be started on its own.

- stories missing or unclear → `business-analyst`
- structure, flows, screen specs, deciding on findings → `ux-designer`
- look & feel, the project design system, UI audit → `ui-designer`
- repeated checks after a stage → `design-auditor`
- "would people understand this?" → `synthetic-user` (signals, never proof)
- the business behind a page (value proposition, audience, proof) → `business-analyst`; the words of a landing or product page → `ux-designer`
- any decision about direction, scope or approval → ask the person; write the answer into `.orbito/process.md`

## Feedback about Orbito
When something goes against what the person wanted or the tool fails, add an anonymous note with `product-feedback` (`feedback.md`). Never change skills because of it unless the person asks.

## Updating Orbito
`npm run update` (or `/orbito-update`) pulls the newest Orbito and refreshes the skills, agents and commands in `.claude/`; the project's own files are never changed. What changed is in Orbito's `CHANGELOG.md`: tell the person in plain words and ask before applying anything that touches the project template. The map of Orbito, its agents and skills is at `#/skills`.

## Recording decisions
One line per decision under "Decisions" in `.orbito/process.md`: date, what, who decided, why. Approvals also go to the phase table.
