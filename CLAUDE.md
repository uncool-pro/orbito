# Orbito — working on the tool itself

Mockups as code (React + TypeScript), reviewed as flows on a board. Not production code: no backend, fictional data, interactions are drawn and clickable, not real.

For people, the same ground is covered in `docs/architecture.md` (how it fits together), `CONTRIBUTING.md` (checks and rules) and `SECURITY.md`; keep them in step when a rule below changes.

## Packages (npm workspaces)
| Package | What | Depends on |
|---|---|---|
| `packages/core` | project model, loading from the file convention, link types, statuses, board layout. Pure TS: no React, no DOM | — |
| `packages/runtime` | what mockups import: `<Link>` / `useLinkProps`, `goTo` / `goBack`, `DeviceScreen`, `PageScreen` (windows of the viewport's size: only the content scrolls, bars and side panels sit in slots), `useFrame` | react |
| `packages/viewer` | the browser app: overview, board (`board/`, camera in `canvas/`), single screen view, design-system catalog (`ds/`, route `#/ds`) | core, runtime |
| `packages/cli` | `orbito check ds` and the design-system analyzer (TypeScript AST); `orbito export` (one screen → static `index.html` via the project's Vite, SSR); `orbito update [--pull]` (refreshes a project's skills, agents and commands from this folder; `--pull` updates the folder from GitHub first) | core, typescript (vite, react from the project) |
| `packages/vite-plugin` | `virtual:orbito/project` (screens, flows, tokens, component docs, design-system report, the team for `#/skills`) + dev endpoints `/__orbito/status`, `/__orbito/file`, `/__orbito/env`, `/__orbito/reveal`, `/__orbito/comments`, `/__orbito/source` | vite, core, cli |
| `packages/create` | `node orbito/packages/create/src/index.ts <folder> [--title] [--platform mobile|web|both] [--locale en|pl] [--no-install]`: copies `templates/base`, fills it in, installs, runs `check:ds`. Technical only — no design questions | cli |
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
- A deliberate one-off in a screen is marked `// ds-exception: <why>` (line above or end of line): the analyzer turns that line's issues into an `info` entry with the reason (rule `ds-exception`), so exceptions stay visible in Health; without a reason it is not an exception.
- `npm run check:ds` (`orbito check ds [--json] [--strict]`) runs the same check the catalog shows at `#/ds/health`. Run it after every change; errors fail CI.
- The analyzer lives in `packages/cli/src/analyze.ts` (TypeScript AST, no browser). Add a rule there with a test in `packages/cli/test/analyze.test.ts`. Files a screen imports from inside `screens/` (views, parts) are screen code: the analyzer follows those imports, checks each file once with the screen rules and counts their components as used by every screen that reaches them.

## Board input rules (keep them this simple)
Drag anywhere pans; two-finger scroll / wheel pans; pinch or Ctrl/⌘ + wheel zooms at the cursor; click a card to select it and see its details on the right (its code in dev mode), and from then on the wheel scrolls that screen until Esc or a click on the empty board; ▶ above a card or a double click starts the prototype from that screen (no hover overlays on cards: hovering only highlights related screens and arrows; in dev mode it measures); Esc leaves; Shift+1 fit. Camera math is pure (`canvas/camera.ts`, unit-tested); input handling is `canvas/controller.ts` (pointer capture, no React re-render while moving). The world is moved through a paused animation whose keyframes follow the camera, never through its style and never with `will-change` or `translate3d`: `canvas/place.ts` says why, with the numbers. A repaint of the board is costly with glass in the screens: keep what follows the pointer cheap, and never make it wait (a delay before the highlight reads as a slow tool). A change to how the board moves or what it keeps live is measured with `scripts/perf` before and after.

## Stable core (towards 1.0)
People's projects depend on how the board, the flows diagram and the prototype behave. These parts are the stable core: **fix them, do not redesign them**, and build new things around them (new views, panels, skills), not into them.
- The core: board layout (`core/src/layout.ts`), the flows graph (`core/src/flowgraph.ts`), the camera and input (`viewer/src/canvas/`), link detection (`viewer/src/board/probe.tsx`), the screen frames (`runtime/src/frames.tsx`), the project convention and `orbito update`.
- Every fix in the core comes with a test that fails without it (e.g. `viewer/test/controller.test.ts`: a click must reach the screen under the cursor). Test real input in the browser too — a synthetic `click()` on an element skips what the browser does between press and click.
- **Orbito never changes how a screen looks.** It may scale a screen, move it and frame it; it never touches what is inside. No style of the viewer reaches into a project's own content (the elements marked `data-pd-content`: a screen on the board, in the details and in the prototype, a component in the catalog), no text style is inherited from the panel around it, and nothing is dropped to make the board faster, with one exception Jakub decided (11.11.2026): below 25% zoom the board leaves out the blur behind frosted glass, where it cannot be seen (`board/detail.ts`, the rule `.pd-world.is-far [data-pd-content] *`). Any other simplification, or another threshold, is his decision again. A rule that names an element by its tag under a panel that also shows a screen ends with `:not(:where([data-pd-content] *))`. `e2e/untouched-screens.spec.ts` fails when any of this breaks; an update must never restyle anyone's designs.
- A change of behaviour there (a default, a gesture, a file format) needs Jakub's OK and a "Changed" note in the changelog with what people must do; anything that would break existing projects ships with its migration in `orbito update`.

## Docker
`Dockerfile` + `docker/` (entry, the sealed dev server with its CSP, the gate) + `templates/base/compose.yaml` + `.github/workflows/image.yml` (publishes to ghcr.io on a `v*` tag). One codebase, two ways to run: `ORBITO_CONTAINER` is the only switch, and code must work with it on and off. In a container everything but `.orbito/status.json` is read-only for the renderer, the project's own `vite.config` is not run, and system actions (reveal, open in editor) are hidden. User guide: `DOCKER.md`. A change to which folders a project needs must update `compose.yaml` and `DOCKER.md` together.

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
`npm install` · `npm run dev` (demo on :5190) · `npm run lint` (Biome; `npm run format` formats) · `npm test` · `npm run test:e2e` (real clicks and the whole road of a new project, in the Chrome on your computer) · `npm run typecheck` · `npm run check:ds` · `npm run build`. Node 22.18+ (the CLI runs its TypeScript sources directly; a build step comes before publishing).
The container tests run with a built image: `docker build -t orbito:dev .`, then `ORBITO_IMAGE=orbito:dev npx playwright test e2e/docker.spec.ts`. Stop any other board on port 5190 first: the browser would reach that one instead.
After a change: typecheck, lint, tests, and look at the board in the browser. A lint rule is silenced only with a `// biome-ignore <rule>: <why>` comment that gives the reason.

## Where things live in the viewer and the plugin
- Addresses, the way back and the select-or-open rule: `viewer/src/app/routes.ts`. No view builds an address by hand.
- Styles, one file per view: `viewer/src/styles/`. A rule belongs to the view it serves; change a selector where it is, do not add an override at the end. Every colour, radius and shadow of the interface is a `--pd-*` token in `styles/base.css` (no raw colours in the other files); the type scale is 11 / 12 / 13 / 15 / 18 / 30 px. Glass (`backdrop-filter`) only on what floats over the board and is small (island, menus), never on screen cards.
- The plugin, in `vite-plugin/src/`: `index.ts` (the virtual module and hot updates, the requirements), `endpoints.ts` (dev endpoints and their protection against other sites, Vite's `/__open-in-editor` included), `team.ts`, `status.ts`, `comments.ts`; `errors.ts` is the error an endpoint answers with. Paths that come from the browser or from a project file are checked with `insideForReal` (`cli/src/files.ts`): inside the project, also once links are followed.
- How connections are sorted for people (this feature, other features, the shared menu) and the links between features: `core/src/features.ts`. Stories from `requirements/*.md`: `core/src/requirements.ts`.
- The shell, one file per panel in `viewer/src/app/shell/`: `Shell.tsx` (the frame), `TopBar.tsx`, `Drawer.tsx` (the trees), `Inspector.tsx` (the right panel: product mode the screen, its requirements and a line with its comments; dev mode its code from `app/CodePanel.tsx`), `Island.tsx`; shared bits in `common.tsx`, shared state in `state.tsx`. Choices remembered on the computer go through `viewer/src/remembered.ts`.
- Comments: the bubble next to a screen (board and prototype, anchored by `data-comment-anchor`, opened through `openComments` in the shell state) in `app/Comments.tsx`, styles in `styles/comments.css`.
- Icons: only from `app/icons.tsx` (shapes copied from Lucide 0.460.0, ISC, notice in the file). A new icon comes from the same set, added there; no hand-drawn SVG icons elsewhere.
- Measuring on the prototype (dev mode): `app/Measure.tsx`. The page as features: `flows/FeatureMap.tsx`.
- What Orbito installs into a project, for `create` and `update` alike: `cli/src/install.ts`.
