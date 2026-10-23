---
name: project-kickoff
description: Starts the design process of an Orbito project (/orbito-init) — sorts the raw material the person dropped into raw/ (inventory, what is good for what, distribution into the project after they agree), finds out whether it is a new product, an existing product, a landing page or a quick prototype, collects what is still missing (requirements, visual guidelines, components, Figma, documents, the target group) and writes the plan into .orbito/process.md. Use when .orbito/process.md says the kickoff is not done, when someone says "start", "init", "new project", or before the first screen of a project.
---

# Project kickoff

## Welcome (say it once, at the start)
In a few friendly sentences: welcome to Orbito; we will set up the project together and you make the decisions — I will ask when something needs your call. Then: Orbito is developed in the open and gets better from real projects, so while we work I will keep short, anonymous notes about the tool itself (not about your product) in `feedback.md`; you can review them, add your own and send them to orbito@uncool.pro whenever it feels right — nothing is ever sent automatically.

The kickoff is the start of the design process, not an installation (that is `npm create orbito`). Its job: know enough to start the right first step, and write it down so every later session knows where the project stands.

## Start from what the person brought: `raw/`
People bring material the way they have it: a folder of files, a zip of an old site, screenshots, exports, notes. They put it all into `raw/` (or tell you where it is) without sorting it. Sorting it is your job, and it comes before any question the material can answer.
1. **Inventory.** Go through everything in `raw/` (open archives, read documents, look at pictures and screenshots, open an old site in the browser). Write `.orbito/sources.md`: one row per item — what it is, what it is good for in this project, its quality (current or outdated, complete or partial, reliable or contradicted by something else), and where it should go.
2. **Understand before asking.** From the material, work out as much as you can of what the kickoff needs: the kind of project (an existing page or app means a redesign), the product, the audience, the offer, the brand, the requirements. Then ask the person only what the material does not answer, and say what you concluded so they can correct it.
3. **Propose the distribution, then do it.** Show the person the plan in short: what goes where, what you will not use and why, what looks confidential. After they agree, **copy** (never move) the material into place:
   | Material | Goes to |
   |---|---|
   | requirements, backlog exports, stories | `requirements/` (checked and completed as stories by the business analyst, `user-stories`) |
   | texts, copy, reviews, the audience's words | `content/` (research and existing copy, via `value-proposition`) |
   | logo, photos, illustrations | `public/images/` (web-ready sizes) |
   | font files (with a licence for web use) | `public/fonts/` + `design-system/fonts.css` |
   | colours, type, spacing from a brand book or an existing product | `design-system/tokens.json` (via `design-system`) |
   | an existing site or app, screenshots | stays in `raw/`; it is audited and rebuilt "as it is" (`orbito` → "Start from what exists") |
   | anything else worth keeping | referenced from `.orbito/sources.md` where it lies in `raw/` |
4. **Protect what is sensitive.** Personal data, real client names, contracts, prices and internal documents stay in `raw/` (which is out of git by default). Nothing from them goes into screens, `public/` or an export unless the person says so; mockups use fictional data.
5. **Keep the trace.** `.orbito/sources.md` says, for every file created from the material, which raw item it came from. When new material arrives later, repeat steps 1–3 for the new items only.

If `raw/` is empty and the person has nothing yet, skip this and ask as below.

## First question: which kind of project
- **New product (greenfield)** — nothing designed yet: `process-new-product` (requirements → information architecture → flows → lo-fi wireframes → review and sync → look & feel → design system → hi-fi → audits).
- **Existing product** — screens, components or documents already exist. `process-redesign`. Start from the sources, not from scratch: rebuild the design system and the screens "as they are", then design changes as versions. A redesign starts with an audit and a keep / fix / redo list the person confirms (`orbito` → "Start from what exists"); the same goes for an existing landing page.
- **Landing page** — a static marketing or sales page whose approved mockup is exported as the real site: run `process-landing-page` (funnel of sections → copy → lo-fi → look & feel → hi-fi → check → export). Collect its brief as that skill lists (the one conversion, who arrives and from where, the offer, real proof, brand assets).
- **Quick prototype** — show an idea fast: run `process-rapid-prototype` (the business analyst picks the 1–2 paths that show the concept best). A product demo will get its own skill.

## What to collect (only what `raw/` did not answer; ask 1–2 questions at a time)
- **The product in a few sentences**: who it is for, what problem it solves, for whom we design (client, own product).
- **Requirements**: is there a functional backlog (user stories)? Where does it live (a tracker such as Jira, documents, nowhere yet)? Ideal: written stories. Missing: suggest a workshop with the client before designing; do not invent requirements.
- **Platforms**: mobile, web or both (sets viewports).
- **Visual guidelines**: brand book, examples, already designed screens, existing components (any technology), Figma files. If something exists, the design builds on it.
- **Target group**: who the users are — needed later for synthetic users.
- **Connectors**: does the team want requirements synced with a tracker? Is there a design tool to import from?
- **Language** of the product and of the work.

Do not run a discovery workshop here: if the product idea itself is unclear (problem, users, appetite of the client), say so and propose a workshop with the client first.

## Output
Fill `.orbito/process.md`: project type, platforms, sources (what and where), the phase table with the first phase marked, open questions. Remove the template's placeholder screen and flow once the first real ones exist. Then hand over to the first step of the chosen process (Orbito writes the strategy with `orbito`): usually the `business-analyst` checks and completes the requirements the person brought (`user-stories`) before the `ux-designer` starts.

## Quality bar
- Nothing assumed silently: every assumption is listed under open questions.
- The person can read `.orbito/process.md` and agree with it in one minute.
