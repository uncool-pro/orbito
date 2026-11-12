# Architecture

How Orbito is put together, for developers reading or changing its code. For what Orbito is and how to use it, see the [README](../README.md); for running it in a container, [DOCKER.md](../DOCKER.md).

## In one paragraph

A designer's project is a folder of ordinary React + TypeScript files: screens, flows, a design system. Orbito reads that folder through a Vite plugin, renders every screen live in the browser, finds the links between screens by rendering each one once, and lays the screens out as flows on a board. There is no server of Orbito's own and no database: the files are the data, git is the history, and the agent (Claude Code) changes the files while the board shows the result.

## The packages

npm workspaces; every package runs from its TypeScript sources (Node 22.18+ strips the types, Vite compiles them for the browser), so there is no build step during development.

```
                        ┌──────────────────────────── the browser ────────────────────────────┐
                        │                                                                     │
  project files ──▶ vite-plugin ──▶ virtual:orbito/project ──▶ viewer ──▶ board, flows, prototype,
  (screens, flows,      │           (screens, flows, tokens,     │          catalog, skills map
   design system,       │            report, team, statuses,     │
   statuses, comments)  │            comments, requirements)     ├── runtime  (what mockups import)
        ▲               │                                        └── core     (model, layout, graph)
        │               └── dev endpoints /__orbito/* ◀── fetch ──┘
        │                    (statuses, comments, files, code)
        └──────────── written by the board (statuses, comments) and by Claude (everything)

  cli ── orbito check ds · export · update · models          create ── a new project from templates/base
```

| Package | Job | May import |
|---|---|---|
| `core` | The project model and everything that can be computed without a browser: loading the file convention, the board layout, the flows graph, the design-system model, statuses, comments, requirements, the team. Pure functions, unit-tested. | nothing else of Orbito; never React or the DOM |
| `runtime` | What mockups import: `Link` / `useLinkProps`, `Transition`, the frames `DeviceScreen` and `PageScreen`, `useFrame`. Small on purpose: every project depends on it. | React |
| `viewer` | The browser app: the shell (top bar, left panel, right panel, island), the board, the flows diagram and the feature map, the prototype, the design-system catalog, the skills map. | core, runtime |
| `vite-plugin` | Assembles the project for the browser as one virtual module, pushes changes to the open board, and serves the few dev endpoints the board needs. | core, cli |
| `cli` | `orbito check ds` (the design-system analyzer, on the TypeScript AST), `orbito export` (one screen as a static page), `orbito update` (refreshes what Orbito installs in a project), `orbito models`. Also the file helpers the plugin shares. | core |
| `create` | Makes a new project from `templates/base` and installs Orbito's skills into it. | cli |

`templates/base` is what a new project starts from; `demo/` (Leafy) is a finished example project and the reference for the file convention.

## How a screen gets onto the board

1. **Files.** `screens/**/<id>.screen.tsx` exports the component and `meta` (`defineScreen`); `flows/*.flow.ts` lists screens in order (`definePage`). The file name is the screen's id.
2. **The plugin** turns them into `virtual:orbito/project`: the modules found by `import.meta.glob`, plus everything read from files on the server side (tokens, the design-system report, statuses, comments, requirements, the team). A file that fails to load becomes a problem shown on the board, not a blank page.
3. **`loadProject`** (`core/src/load.ts`) builds the model and reports what is wrong: duplicate ids or codes, flows that name missing screens, unknown viewports.
4. **The probe** (`viewer/src/board/probe.tsx`) renders every screen once, offscreen, at its real size, and records each element marked `data-pd-to` with its position. That is the link map. Links are declared once, where they are drawn; nobody draws arrows by hand.
5. **The layout** (`core/src/layout.ts`) places cards in lanes, one lane per flow, and routes the arrows from the element that triggers them. The flows diagram (`core/src/flowgraph.ts`) uses the same link map to find dead ends, unreachable screens and missing steps.
6. **The board** (`viewer/src/board/Board.tsx`) draws it. The camera lives outside React (`canvas/controller.ts` writes one transform per frame), and cards get their live screen only once they come near the view.

## How a change travels

- **Claude edits a screen:** Vite updates the module; the plugin also rebuilds the project module, because it carries the design-system report.
- **Someone sets a status or writes a comment on the board:** the board calls `/__orbito/status` or `/__orbito/comments`; the plugin writes one entry (statuses) or one file per comment, and every open board gets the new data without a reload.
- **Claude edits `status.json` or a comment file:** the plugin sees the change and pushes it to open boards the same way.
- **Tokens, fonts, requirements, model settings:** the page reloads; these are read once when the project module is built.

## Decisions worth knowing

- **No backend.** The files are the database and git is the history and the sync between people. Nothing to host, nothing to back up, and the agent works on the same files people review.
- **Links found, not declared.** Declaring arrows separately from the screens would drift; reading them from the rendered screens cannot.
- **The stable core.** Layout, flows graph, camera and input, link detection, screen frames, the file convention and `orbito update` are what people's projects depend on. They are fixed, not redesigned, and every fix comes with a test that fails without it (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
- **Two ways to run, one codebase.** From the code, or sealed in a container (`ORBITO_CONTAINER` is the only switch). In the container the project is read-only except statuses and comments, the project's own `vite.config` is not run, and the page cannot call other sites. See [SECURITY.md](../SECURITY.md) and [DOCKER.md](../DOCKER.md).
- **Mockups, not production code.** Screens use only the design system; the analyzer enforces it (tokens for every value, no raw interactive elements, atomic levels). The rules are listed in [CLAUDE.md](../CLAUDE.md#design-system-rules-the-tool-enforces).

## Where to look

| To change… | Start in |
|---|---|
| what a project file means | `core/src/model.ts`, `core/src/load.ts` |
| the board's geometry | `core/src/layout.ts` (+ `core/test/layout.test.ts`) |
| gestures on the board | `viewer/src/canvas/` (+ `viewer/test/controller.test.ts`, `camera.test.ts`) |
| a design-system rule | `cli/src/analyze.ts` (+ `cli/test/analyze.test.ts`) |
| a dev endpoint | `vite-plugin/src/endpoints.ts` (+ `vite-plugin/test/endpoints.test.ts`) |
| what a new project gets | `templates/base`, `cli/src/install.ts` |
| an address in the viewer | `viewer/src/app/routes.ts` |
| a panel of the interface | `viewer/src/app/shell/` (one file per panel) |
| a colour or size of the interface | `viewer/src/styles/base.css` (every `--pd-*` token) |
