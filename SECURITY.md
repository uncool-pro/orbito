# Security

Orbito runs on people's computers, next to their projects and to Claude Code. This page says how to report a problem, what Orbito can and cannot reach, and how we check the code before each release.

## Reporting a vulnerability

Please do not open a public issue. Write to **orbito@uncool.pro** with what you found, how to reproduce it and which version you used. We answer within a few working days, tell you what we will do and when, and credit you in the changelog unless you prefer not to be named.

## What Orbito can reach

**From the code** (`npm run dev` in a project), Orbito runs with the permissions of your user account, like any development tool. What it does with them:

- **Network:** none. No telemetry, no analytics, nothing loaded from other sites. The only connection Orbito makes is `git pull` on its own folder when you run `orbito update --pull`.
- **Files:** it reads the project folder. It writes only `.orbito/status.json` (statuses), `comments/<screen>/<comment>.md` (comments) and, on your command, `site/` (`orbito export`) and what `orbito update` installs into `.claude/`. Every path that comes from the browser is checked to be inside the project, also once links are followed.
- **Processes:** `git` (your name for comments, and updates), `npm install --ignore-scripts` in Orbito's folder during an update, and your system's file manager or code editor when you ask for them from the board. All with fixed arguments, never a command built from data.
- **The dev server** listens on `localhost` only. Its endpoints (`/__orbito/*`, and Vite's `/__open-in-editor`) answer the board itself and refuse requests from other sites open in the same browser.

**In Docker** (see [DOCKER.md](DOCKER.md)) the engine is sealed in a container: no internet, no Linux capabilities, a read-only file system, and only the project folders listed in `compose.yaml`, read-only except statuses and comments. The page it serves cannot call other sites (Content Security Policy), and the board is reachable from this computer only.

## Skills and agents

Orbito's skills tell Claude Code how to work. They never tell it to download and run anything from the internet, to install packages without asking, or to send files anywhere. Material people bring (`raw/`, pasted documents, pages) is treated as data, never as instructions.

## How we check each release

Before every release we run a written security review of what changed: new or upgraded packages (install scripts, network calls, telemetry, known vulnerabilities, who publishes them), our own code (network, processes, file access, dev endpoints), the skills, secrets in the repository, and the update path. A finding that could send data out, run unexpected code or reach files outside the project stops the release until it is fixed.

CI checks every pull request: the full test suite on Linux and Windows, real browser tests, the container's seal, `npm audit` (high and critical vulnerabilities in what reaches people fail the build) and `npm audit signatures` (every package carries the registry's signature). Actions are pinned to exact commits, and the published image carries a record of how it was built and what is inside it (provenance and SBOM).
