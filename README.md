# Orbito

Mockups as code, reviewed as flows on a board. Built for product designers who work with an AI agent in Claude Code: the agent builds screens from your design system, you see every flow on one board, statuses and review versions included, and you make the decisions.

> Status: early work in progress (0.0.0). Not published yet.

## Try it
```sh
npm install
npm run dev      # http://localhost:5190 — the demo application "Leafy"
```

- `#/board` — every flow as a lane of live screens, arrows detected from the screens themselves, starting at the element that triggers them; review versions as lanes under their flow.
- `#/ds` — the design system: tokens with usage notes and contrast, components by atomic level with variants, where each one is used, and the rule check.
- `#/s/PL-01` — one screen, clickable like a prototype.
- `#/` — overview: pages, flows, screens, and problems found in the project files.

Board controls: drag or scroll to move · pinch or Ctrl + scroll to zoom · click a screen to scroll it · double-click to open · Shift+1 to fit.

## How a project is organised
See `demo/` — a complete demo application in one folder, and the structure to copy — and `CLAUDE.md` (written for both people and agents). Starting your own project? Ask Claude to "remove the demo application".

## Roadmap
Orbito grows with its skills: each skill is one part of the product design process, and the tool shows its results on the board. No dates; the order may change as the beta shows what people need most.

| Step | Skills | In Orbito |
|---|---|---|
| **Now · beta 0.9** (newsletter subscribers) | UX: information architecture and flows · mockups from a description · UI: look & feel and a design system from building blocks · requirements and test lists · rapid prototypes and product demos | flow board with versions and statuses, design-system catalog, automatic rule checks |
| **Next · tests in real projects** | the beta skills, improved after every piece of feedback | fixes from your reports |
| **1.0 · public release** | stable beta skills, step-by-step guide | one-command project start, demo application |
| **New skills · research and discovery** | discovery (problem, users, hypotheses) · interviews and synthesis · tests with synthetic users · accessibility (WCAG) | research findings pinned to screens and flows |
| **Direction · product analytics** | analysis of data from the live product · input for the next version | product data next to the screens it is about |
| **Further future · local AI models** | part of the agent's work runs on your computer: fewer cloud tokens, fewer extra licences; worth it on stronger hardware (e.g. a GPU with 8 GB+ of memory, exact threshold to be tested) | choose what runs locally and what in the cloud |

A skill becomes stable only after it is tested on an example project.

## Licence
MIT
