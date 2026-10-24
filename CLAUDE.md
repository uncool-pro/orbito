# Orbito — working on the tool itself

Mockups as code (React + TypeScript), reviewed as flows on a board. Not production code: no backend, fictional data, interactions are drawn and clickable, not real.

## Packages (npm workspaces)
| Package | What | Depends on |
|---|---|---|
| `packages/core` | project model, loading from the file convention, link types, statuses, board layout. Pure TS: no React, no DOM | — |
| `packages/runtime` | what mockups import: `<Link>` / `useLinkProps`, `goTo` / `goBack`, `DeviceScreen`, `PageScreen` (windows of the viewport's size: only the content scrolls, bars and side panels sit in slots), `useFrame` | react |
| `packages/viewer` | the browser app: overview, board (`board/`, camera in `canvas/`), single screen view, design-system catalog (`ds/`, route `#/ds`) | core, runtime |
| `packages/cli` | `orbito check ds` and the design-system analyzer (TypeScript AST); `orbito export` (one screen → static `index.html` via the project's Vite, SSR); `orbito update [--pull]` (refreshes a project's skills, agents and commands from this folder; `--pull` updates the folder from GitHub first) | core, typescript (vite, react from the project) |
| `packages/vite-plugin` | `virtual:orbito/project` (screens, flows, tokens, component docs, design-system report, the team for `#/skills`) + dev endpoints `/__orbito/status`, `/__orbito/file`, `/__orbito/env`, `/__orbito/reveal` | vite, core, cli |
| `packages/create` | `npm create orbito <folder> [--title] [--platform mobile|web|both] [--locale en|pl] [--no-install]`: copies `templates/base`, fills it in, installs, runs `check:ds`. Technical only — no design questions | — |
| `templates/base` | the project template: base design-system kit (28 components, neutral tokens, docs), `CLAUDE.md` for the user's project, `.orbito/process.md` (design process state), a placeholder start screen | all |
| `demo/` | **demo application** "Leafy": a fictional plant-care app, the reference structure of a project (mobile + web screens, atomic design system, a review version). Safe to delete | all |

Boundaries: `core` never imports React or the DOM; `runtime` never imports `viewer`; screens never import `viewer`.

## Project convention (what a user's project looks like)
- `orbito.config.ts` — title, locale, default viewport.
- `screens/**/<id>.screen.tsx` — default export = component, `export const meta = defineScreen({ code, title, viewport?, back?, requirements? })`. The file name is the id.
- `flows/*.flow.ts` — `definePage({ key, name, flows: [{ key, name, screens: [...ids], versions? }] })`.
- `design-system/` — tokens, atoms, molecules, organisms. Screens use only the design system.
- `.orbito/status.json` — feature (flow) statuses, `flow:<page>/<flow>`, written by the board in dev or by Claude; the dev server pushes changes to the open board.

Links are declared once, where they are drawn: an element with `data-pd-to` (via `useLinkProps` / `<Link>`). The viewer renders every screen offscreen once (`viewer/src/board/probe.tsx`) and reads the links and their positions; the board draws arrows from the triggering element.

## Design system (rules the tool enforces)
- `design-system/tokens.json` holds every value: groups (`color`, `font`, `type`, `space`, `radius`, `shadow`, `motion`, or your own) of `{ name, value, usage, on?, large? }`. Each token becomes `--<name>`. `usage` is mandatory; `on` lists the backgrounds a text colour sits on (contrast is checked).
- Components live in level folders: `atoms/` → `molecules/` → `organisms/` → `templates/`. A component builds only on its own level or lower ones. Exported PascalCase names, unique across the system, re-exported from `design-system/index.ts`.
- Next to each component: `<Name>.docs.tsx` with `defineDocs({ component, description, guidelines: { do, dont }, variants: [{ name, render, note?, width? }] })` — every variant and state the component has.
- Screens import from `design-system` (entry point) only; no raw `<button>`/`<a>`/`<input>`, no event handlers, no raw colours, no hard-coded spacing or fonts. Something missing → add it to the design system first, then use it.
- `npm run check:ds` (`orbito check ds [--json] [--strict]`) runs the same check the catalog shows at `#/ds/health`. Run it after every change; errors fail CI.
- The analyzer lives in `packages/cli/src/analyze.ts` (TypeScript AST, no browser). Add a rule there with a test in `packages/cli/test/analyze.test.ts`.

## Board input rules (keep them this simple)
Drag anywhere pans; two-finger scroll / wheel pans; pinch or Ctrl/⌘ + wheel zooms at the cursor; click a card to start the prototype from that screen (no hover overlays on cards: hovering only highlights related screens and arrows); Esc leaves; Shift+1 fit. Camera math is pure (`canvas/camera.ts`, unit-tested); input handling is `canvas/controller.ts` (pointer capture, no React re-render while moving).

## Template vs demo
`templates/base` is what every new project starts from: keep it neutral, generic and passing `check:ds` with 0 errors and 0 warnings. `demo/` is a finished example project with its own design system. Changes to the base kit go to the template; the demo shows what a project looks like after the kickoff.

## Demo application (`demo/`)
`demo/` is a complete example project in one folder. Read it before building something new: it is the target structure (see `demo/README.md`). Keep it passing `npm run check:ds` with 0 issues.

When the user asks to remove the demo application ("usuń demo", "remove the demo application"), confirm once, then:
1. Delete the `demo/` folder.
2. In the root `package.json`: remove `"demo"` from `workspaces`; point `dev`, `build` and `check:ds` at the user's project folder, or remove them if there is none yet.
3. In `tsconfig.json`: remove the `demo/...` entries from `include`.
4. In `.claude/launch.json` (if present): fix the preview entry that runs the demo.
5. Run `npm install`, `npm run typecheck` and `npm test`; report what was removed.
Never delete anything outside `demo/` other than these references.

## Commands
`npm install` · `npm run dev` (demo on :5190) · `npm test` · `npm run typecheck` · `npm run check:ds` · `npm run build`. Node 22.18+ (the CLI runs its TypeScript sources directly; a build step comes before publishing).
After a change: typecheck, tests, and look at the board in the browser.
