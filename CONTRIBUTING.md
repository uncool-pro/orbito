# Contributing to Orbito

Thank you for looking. This page is for anyone changing Orbito's code: how to set it up, what is checked, and the few rules that keep it easy to work on. How the parts fit together: [docs/architecture.md](docs/architecture.md).

## Set up

You need Node.js 22.18 or newer, git, and Chrome for the browser tests.

```sh
git clone https://github.com/uncool-pro/orbito
cd orbito
npm install
npm run dev        # the demo project on http://localhost:5190
```

There is no build step: Node and Vite run the TypeScript sources directly.

## Checks

| Command | What it checks | Runs in CI |
|---|---|---|
| `npm run typecheck` | types of every package, the tests, the demo, the template and the Docker scripts | yes |
| `npm test` | unit tests (Vitest) | yes, Linux and Windows, Node 22.18 and 24 |
| `npm run check:ds` | the design-system rules on the demo (`-w template-base` for the template) | yes |
| `npm run build` | the demo builds as a static site | yes |
| `npm run test:e2e` | real clicks in Chrome, and the whole road of a new project | yes |
| `ORBITO_IMAGE=orbito:dev npx playwright test e2e/docker.spec.ts` | the image works and its seal holds (after `docker build -t orbito:dev .`) | yes |
| `npm audit --omit=dev` | known holes in what reaches people's computers | yes, high and critical fail the build |

Before you open a pull request: `npm run typecheck`, `npm test` and `npm run check:ds` pass, and you have looked at the board in the browser.

## Rules

- **The stable core is fixed, not redesigned.** The board layout, the flows graph, the camera and input, link detection, the screen frames, the file convention and `orbito update` are what people's projects depend on. A fix there comes with a test that fails without it. A change of behaviour (a default, a gesture, a file format) needs the maintainer's agreement first, a "Changed" entry in the changelog saying what people must do, and, if it would break existing projects, a migration in `orbito update`.
- **Boundaries between packages.** `core` never imports React or the DOM; `runtime` never imports `viewer`; a package uses another through its name (`@uncool-pro/orbito-core`), never through a path into its folder.
- **Anything that comes from outside is checked where it enters.** A path from the browser or from a project file goes through `insideForReal` (`packages/cli/src/files.ts`); a request body is a JSON object of bounded size; an id that becomes a file name cannot be `.` or `..`. Processes are started with an argument list, never a string built from data.
- **No new dependency without a reason.** Every package that reaches people's computers is one more thing to trust. Ask first whether a few lines of our own would do. A new or upgraded dependency goes through the security checklist in [SECURITY.md](SECURITY.md).
- **No network.** Orbito never calls anything outside the person's computer: no telemetry, no fonts or scripts from other sites. The only exception is `orbito update --pull`, which runs `git pull` on Orbito's own folder.
- **Comments say why.** The code says what it does; a comment explains the reason, the trap it avoids, or the behaviour a person sees. Plain words, full sentences, no ticket numbers.
- **Interface:** every colour, radius and shadow is a `--pd-*` token in `packages/viewer/src/styles/base.css`; icons come only from `packages/viewer/src/app/icons.tsx`; addresses are built only in `packages/viewer/src/app/routes.ts`.

## Changes and releases

- One pull request per change, with what it changes for people and how you checked it.
- Every change people notice gets a line in [CHANGELOG.md](CHANGELOG.md), written for the people who use Orbito: what changes for them and what, if anything, they must do.
- A release is a version in `package.json` and a tag `v<version>`; the tag publishes the Docker image (`.github/workflows/image.yml`), which refuses a tag that does not match the version.

## Licence

By contributing you agree that your contribution is released under the MIT licence of the project. The Orbito name and logo are not covered by it (see the README).
