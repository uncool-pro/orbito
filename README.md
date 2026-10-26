<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/orbito-wordmark-light.svg">
    <img src="assets/orbito-wordmark.svg" alt="Orbito" width="240">
  </picture>
</p>

# Orbito

Orbito turns Claude Code into a product designer's agent. Its skills are a product design process written down step by step — requirements, information architecture, flows, mockups, look & feel, design system, audits — and the mockups are code from the start. You describe the idea and make the decisions; the agent builds clickable mockups and keeps requirements, flows and screens consistent. You see it all on one board.

> **Beta 0.9** — free and open source (MIT). It works, it still has rough edges, and it grows week by week: see [CHANGELOG.md](CHANGELOG.md).

## Get started
You need [Claude Code](https://claude.com/claude-code) (a paid Claude plan), [Node.js](https://nodejs.org) 22.18 or newer and git. Everything runs on your computer.

**The easy way:** open Claude Code in the folder where you keep your projects and write:

> Install Orbito from https://github.com/uncool-pro/orbito and set up a new project for me.

Claude follows the steps below and asks you only for the project's name, platform and language. Then:

1. Put everything you already have into the project's `raw/` folder, unsorted: an old site, brand files, texts, notes, screenshots.
2. Open Claude Code in the project folder and type **`/orbito-init`**. From here Orbito leads: it sorts `raw/`, asks what kind of project this is and proposes the first step.
3. See the board: `npm run dev` in the project folder, then http://localhost:5190.

Later, `npm run update` in the project brings the newest Orbito (or ask Claude to "update Orbito").

### The steps (for you, or for Claude installing Orbito for someone)
1. Clone Orbito into a folder that stays where it is — projects link to it, and updates come from it:
   ```sh
   git clone https://github.com/uncool-pro/orbito
   cd orbito && npm install
   ```
2. In the folder where the project should live, create it (ask the person for the name, the platform — `web`, `mobile` or `both` — and the language of the tool, `en` or `pl`; no other questions, the design questions come with `/orbito-init`):
   ```sh
   node orbito/packages/create/src/index.ts my-product --title "My product" --platform web --locale en
   ```
   It copies the project template, installs it, and checks it. Never move or rename the `orbito` folder afterwards.
3. Tell the person to put their material into `my-product/raw/`, open Claude Code in `my-product/` and type `/orbito-init`.

## What you see
- **Board** (`#/board`) — every feature as a lane of live screens, arrows drawn from the element that triggers them, statuses per feature, review versions under their flow. Drag to move · pinch or Ctrl + scroll to zoom · click a screen to open the prototype from there · Shift+1 to fit.
- **Flows** (`#/flows`) — the flows as a diagram (happy, alternative and error paths), drawn from the screens themselves, with dead ends and unreachable screens found for you.
- **Prototype** (`#/s/<screen>`) — click through the screens like the real product; a responsive web page is shown at desktop, tablet and phone sizes side by side.
- **Design system** (`#/ds`) — tokens with usage notes and contrast, components by atomic level with variants and where each is used, and the rule check (`npm run check:ds`).
- **Skills** (`#/skills`) — Orbito, the processes it runs, and the roles with their competences and models.

## Try the demo
In the `orbito` folder: `npm run dev`, then http://localhost:5190 — "Leafy", a fictional plant-care app (mobile and web screens, its own design system, a review version). `demo/` is also the structure of a finished project.

## How it works
Orbito (the lead) talks to you, picks a process that fits the project (a new product, a redesign, a landing page, a quick prototype) and calls a role for each step: business analyst, UX designer, UI designer, design auditor and synthetic users, each with its own competences (skills). People decide; agents build, check and keep everything consistent. Details: [skills/README.md](skills/README.md); the conventions for people and agents: [CLAUDE.md](CLAUDE.md).

## Roadmap
Orbito grows with its skills: each skill is one part of the product design process, and the tool shows its results on the board. No dates; the order may change as the beta shows what people need most.

| Step | Skills | In Orbito |
|---|---|---|
| **Now · beta 0.9** (public) | requirements and user stories · value proposition · UX: information architecture, flows, mockups, interface and page copy · UI: look & feel, design system, hi-fi screens · audits (UX, UI, accessibility WCAG 2.2 AA) · tests with synthetic users · rapid prototypes · landing pages exported as a static site | board with versions and statuses, flows diagram, clickable prototype, design-system catalog, automatic rule checks, skills map |
| **Next · tests in real projects** | the beta skills, improved after every piece of feedback | fixes from your reports |
| **1.0 · public release** | stable beta skills, step-by-step guide | one-command project start, demo application |
| **New skills · research and discovery** | discovery (problem, users, hypotheses) · interviews and synthesis · product demos with a narrated walk-through | research findings pinned to screens and flows |
| **Direction · product analytics** | analysis of data from the live product · input for the next version | product data next to the screens it is about |
| **Further future · local AI models** | part of the agent's work runs on your computer: fewer cloud tokens, fewer extra licences; worth it on stronger hardware (e.g. a GPU with 8 GB+ of memory, exact threshold to be tested) | choose what runs locally and what in the cloud |

A skill becomes stable only after it is tested on an example project.

## Feedback
Orbito keeps anonymous notes about the tool in your project's `feedback.md` (what worked, what did not); add your own. They are what the next versions are built from.

## Licence
MIT
