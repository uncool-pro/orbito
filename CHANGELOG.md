# Changelog

How to update a project: `npm run update` in the project (or `/orbito-update` in Claude Code). It pulls the newest Orbito and refreshes the skills, agents and commands in `.claude/`; your screens, flows and design system are never changed. Entries marked **template** add something to new projects only: ask Orbito to bring it into an existing one.

## 0.9.3 — 2026-10-24
UX review of the viewer itself (notes from use, decided with the `ux-review` competence).
- **Statuses belong to features, not screens:** a change of requirements touches the whole flow, so the status sits on the flow (the lane header on the board, a dot next to the flow in the left panel, the list of features in the details panel). Stored in `.orbito/status.json` under `flow:<page>/<flow>`; old per-screen entries are ignored.
- **Status as a dropdown in place:** a native select where the status is shown — no more menu opening outside the screen (and blocking clicks, which stopped screens from highlighting on hover).
- **Two-way sync:** a status changed on the board writes the file; a status Claude (or you) writes in the file shows on the open board at once, without a reload.
- **One purpose for the right panel — "Details":** with nothing selected, the features of this page with their statuses; with a screen selected, its details (where it leads, by name). View options moved to "View" on the bottom island.
- **Light captions above screens, as in design tools:** the code small and grey on top (with a version's findings), the functional name right over the screen, up to two lines — room for names of up to about six words ("Edit notification options"), the full title on hover; no frame around the card, no status and no ↗ button (a click on a screen already opens the prototype).
- **Screen codes and names, written down:** the `wireframes` skill now says how to name and number screens — the name says what happens, in the users' words; the code is `<AREA>-<NN>` per area of the information architecture (not per feature: one screen often serves several features, and features change), permanent, never renumbered; review versions `PL-02·A`. A team with its own numbering keeps it.
- **Names instead of codes:** flow boxes lead with the screen's name; ways out under a screen are a quiet arrow with a count, and on hover they name where they go — a screen of the same feature by its name, any other way out by the feature it opens ("→ Add a plant").
- **For developers, in the screen details:** where the screen lives in code — the file path (copy it whole), **Show in Explorer / Finder** (the name follows your system), **Open in editor**, and **Copy for Claude** (a reference to the screen to paste into the chat). No HTML/CSS dump: a screen is built from design-system components, which the details already list.
- **Left panel redone after a UX audit:** one chevron icon for every level (pages too) with a proper click area; one row height and indentation with guide lines; names first and codes small and grey on the right (pages, features, screens); a feature's path shown as the line from the flows legend (solid, dashed, dotted), so the only dot left is its status; versions with a branch icon and their state as a label.
- **New model policy** (Sonnet with medium effort gave weak, generic designs in testing):
  - **Sonnet high is the floor**, used only for work that is repeated or run many times in parallel: the design auditor and the synthetic users. Nothing runs on Haiku any more.
  - **Opus medium is the default** for the work itself (business analyst, UI designer).
  - **Opus high for strategic decisions** made once that everything after builds on: Orbito, the UX designer (architecture and flows), the value proposition, look & feel.
  - The **high** mode moves everything to Opus, one effort step up, and the strategic work to very high effort (`xhigh`).
  - A competence can have its own line in the profiles (`<role>/<skill>`), used when Orbito delegates that competence: `ui-designer/look-and-feel` and `business-analyst/value-proposition`. The skills map shows it next to the competence; `orbito models` lists it. A test guards the policy in the shipped profiles. Projects get the new profiles with `orbito update`.
- **Look & feel, reworked after a failed test on a redesign:**
  - asks first **how big the change is** (refresh, redesign or from scratch) and what must stay versus what gets ploughed over; in a full redesign the current page is a source of content and assets, never of layout;
  - sets a **quality bar from references**: the person's examples plus the best current work in the industry, with what to learn from each;
  - **an idea is structure, not decoration**: a device laid over an unchanged layout is rejected (test: remove it — does the design change?), with a worked example;
  - redefines the levels: safe = calm and professionally designed, in between = classic layout with a few deliberate effects, bold = a modern concept on the level of the references;
  - uses the assets well (real photos, an icon with a short text where people scan a list) and adds a last critique pass against the references.
- **Responsive pages, three sizes side by side:** a screen can declare `viewports: ['desktop', 'tablet-web', 'mobile-web']` — one implementation, shown at desktop size on the board and at all sizes next to each other (one scale) in the prototype view. Pages are query containers, so `@container page (…)` rules and `cqi` units adapt them to each width. New built-in viewport `tablet-web`. Landing pages are now one responsive screen instead of separate desktop and phone screens.

## 0.9.2 — 2026-10-23
- **Skills in three layers:** Orbito (the lead) runs **processes** (`process-new-product`, `process-redesign`, `process-rapid-prototype`, `process-landing-page`), each a table of steps with the role, the competence, the output and where you decide; **roles** (agents) preload their own **competences** (`skills:` in the agent file).
- **New competences:** UX — `information-architecture`, `user-flows`, `wireframes`, `ux-writing`, `ux-review` (from the former `ux-design`); BA — `user-stories` (good-practice stories: INVEST, given/when/then, splitting, definition of ready; checks and completes what you bring), `prototype-scope`, `requirements-sync`; UI — `ui-design` (hi-fi screens).
- **Stories ↔ flows:** the UX designer builds flows from the analyst's stories and links them (`requirements` on a flow, `meta.requirements` on a screen, `requirements/coverage.md`).
- **Skills map** shows the three layers: Orbito, the processes with their steps, the roles with their competences.
- **Five roles:** business analyst, UX designer, UI designer, design auditor, synthetic user. The UX and UI designers build their screens in code themselves (the prototyper role is gone); the copywriter's work is split into `value-proposition` (business analyst: audience, values, proof, personas) and `page-copy` (UX designer: the words of the page, written from it).
- **Rapid prototype = a vertical slice:** the analyst picks the slice from all the context, UX builds the flow and lo-fi screens with copy, a critical UX audit and fixes repeat until clean; UI goes on top only if the person wants it and a look & feel exists. (A narrated demo of the prototype comes later.)
- **Stories stay consistent:** after any approval of flows or screens the analyst shows where they differ from the stories, asks whether to update them, and keeps `requirements/` and the team's tracker (through a connector) in sync.
- **Model modes, personal:** `optimal` (each role on the model and effort its work needs — fewer tokens) or `high` (the strongest model almost everywhere, high effort where the work is strategic). Two profiles in `.orbito/models.json` (Orbito's). Each person picks their own: `npx orbito models high` saves it in `.orbito/settings.local.json` (git-ignored); `--team` sets the team's default in `.orbito/settings.json`; the `ORBITO_MODELS` environment variable wins over both. Agent files never change — Orbito passes the profile's model and effort each time it calls an agent. Orbito asks at the kickoff; the top bar shows the mode next to "Skills" (hover: what it means, whose setting it is, how to switch); the skills map shows each role's model and effort in that mode.
- **Personal files stay personal:** `.orbito/settings.local.json` and `feedback.md` are in `.gitignore` (`orbito update` adds them to older projects), so one person's settings or feedback notes never reach the team's repository.
- The skills map refreshes by itself when skills, agents or the model mode change.
- Removed and replaced by the above: skills `ux-design`, `requirements`, `rapid-prototyping`, `landing-page`, `sales-copy`; agents `prototyper`, `copywriter` (`orbito update` removes them).

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
