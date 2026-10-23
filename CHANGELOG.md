# Changelog

How to update a project: `npm run update` in the project (or `/orbito-update` in Claude Code). It pulls the newest Orbito and refreshes the skills, agents and commands in `.claude/`; your screens, flows and design system are never changed. Entries marked **template** add something to new projects only: ask Orbito to bring it into an existing one.

## 0.9.2 — 2026-10-23
- **Skills in three layers:** Orbito (the lead) runs **processes** (`process-new-product`, `process-redesign`, `process-rapid-prototype`, `process-landing-page`), each a table of steps with the role, the competence, the output and where you decide; **roles** (agents) preload their own **competences** (`skills:` in the agent file).
- **New competences:** UX — `information-architecture`, `user-flows`, `wireframes`, `ux-writing`, `ux-review` (from the former `ux-design`); BA — `user-stories` (good-practice stories: INVEST, given/when/then, splitting, definition of ready; checks and completes what you bring), `prototype-scope`, `requirements-sync`; UI — `ui-design` (hi-fi screens).
- **Stories ↔ flows:** the UX designer builds flows from the analyst's stories and links them (`requirements` on a flow, `meta.requirements` on a screen, `requirements/coverage.md`).
- **Skills map** shows the three layers: Orbito, the processes with their steps, the roles with their competences.
- Removed and replaced by the above: `ux-design`, `requirements`, `rapid-prototyping`, `landing-page` (`orbito update` removes them).

## 0.9.1 — 2026-10-23
- **Skills map** (`#/skills`, "Skills" in the top bar): Orbito, the agents under it, and the skills each agent uses, with what they are for — read from the project's `.claude/` folder.
- **Updates from GitHub:** `orbito update [--pull]`, the `npm run update` script (added to older projects on the first update) and the `/orbito-update` command.
- **Board:** a click on a screen starts the prototype from that screen; hovering a card no longer shows the link labels of every button.
- **Fix:** the board could stay blank on the first load (a race between the redirect to the board and the address listener).
- Skill `orbito-lead` is now `orbito` (the update removes the old one).

## 0.9.0 — 2026-10-22 (beta)
- Board of flows, flows diagram (business notation, findings found by code), clickable prototype, design-system catalog with `orbito check ds`.
- `npm create orbito`: the base template (28 components, neutral tokens), `raw/` for the material you bring, `.orbito/process.md`.
- Static export of a page: `orbito export` (landing pages: `Section`, `Grid`, `Disclosure`, links with `href`, fonts in `design-system/fonts.css`, the `mobile-web` viewport).
- Skills and agents: Orbito (the lead) with business analyst, UX designer, copywriter, prototyper, UI designer, design auditor and synthetic user; processes for new products, redesigns, landing pages and quick prototypes.
