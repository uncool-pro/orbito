# Orbito in Docker

Written for two readers: the person deciding how to run Orbito, and the Claude setting it up for them.

## Two ways to run Orbito, one Orbito

The code is the same. Only the way it runs differs, and a project's files are the same in both.

| | **Docker** (for commercial work) | **From the code** (for tinkering) |
|---|---|---|
| Who it suits | Client and company projects; anyone whose security team reviews tools | People who want to change Orbito itself, or use extra packages freely |
| You install | Docker | Node.js and git, then Orbito's packages with `npm install` |
| Where the packages run | Sealed in a container | On your computer, with your permissions |
| What the packages can reach | Only the project folders listed in `compose.yaml`, read-only, with no internet | Everything your user account can reach |
| Change Orbito's engine | No (the code is open: build your own image) | Yes |
| Extra npm packages in a project | Not available yet | Yes |
| "Show in Explorer", "Open in editor" | Not available | Yes |

**How to choose:** a project for a client or with confidential material → Docker. Trying Orbito out or working on Orbito → from the code. If unsure, ask the person which it is; do not choose for them.

## Why Docker

Orbito depends on about 80 npm packages. A package that gets taken over could run code with your permissions: read your keys, other clients' folders, and send them away. Orbito's packages are audited, but an audit only says they are clean today.

A container is a sealed box on your computer, with its own system and its own files. Orbito's image holds the engine and exactly the package versions from the lockfile, installed once when the image is built, without install scripts. Nothing is installed on your computer.

## How it fits together

```
your computer                               containers
─────────────                               ──────────
Claude Code ── edits ──> project folder ── read-only ──> renderer (no internet)
                                                            │
browser ── localhost:5190, this computer only ──> gate ─────┘
```

- **Claude Code stays outside.** It works on the project folder as usual and keeps its skills in `.claude/`. The renderer only reads the files and shows them; a change appears on the board by itself.
- **The renderer sees only what it needs**, read-only: `screens`, `flows`, `design-system`, `public`, `src`, `content`, `reviews`, `.claude`, `.orbito` and three config files. It never sees `raw/`, `.env`, `.git` or anything else on your computer. The one file it can write is `.orbito/status.json` (statuses set on the board).
- **The renderer has no internet.** The gate is a few lines that pass your browser's connections to it, on this computer only.
- **The page in the browser cannot call other sites** (a Content Security Policy). So external fonts and images do not load: keep them in `public/` and `design-system/fonts.css`.

## Set up a new project

1. Install Docker ([Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows and Mac; check that its license fits your company) and start it.
2. In the folder where the project should live, in a terminal (PowerShell, or a Mac or Linux terminal):
   ```sh
   docker pull ghcr.io/uncool-pro/orbito:latest
   docker run --rm --network none -v "${PWD}:/work" -w /work ghcr.io/uncool-pro/orbito:latest create my-product --title "My product" --platform web --locale en
   ```
   Ask the person for the name, the platform (`web`, `mobile` or `both`) and the language of the tool (`en` or `pl`). No other questions: the design questions come with `/orbito-init`.
3. Tell the person to put their material into `my-product/raw/`, open Claude Code in `my-product/` and type `/orbito-init`.
4. Start the board in `my-product/`, then open http://localhost:5190:
   ```sh
   docker compose up -d
   ```

Linux only: files keep your user id, so set it first: `export ORBITO_UID=$(id -u) ORBITO_GID=$(id -g)`, and add `--user "$(id -u)"` to `docker run`.

## Every day

| What | Docker | From the code |
|---|---|---|
| Start the board | `docker compose up -d` | `npm run dev` |
| Stop the board | `docker compose down` | Ctrl+C |
| Design-system check | `docker compose run --rm tools check ds` | `npm run check:ds` |
| Type check | `docker compose run --rm tools typecheck` | `npm run typecheck` |
| One page as a static site | `docker compose run --rm export <screen-id>` (or set `site.screen` in `orbito.config.ts`) | `npm run export` |
| Model mode | `docker compose run --rm admin models high` | `npx --no orbito models high` |

The board as a static site (`npm run build`) is available only from the code for now.

## Update

Download the new image and let it refresh the project:

```sh
docker pull ghcr.io/uncool-pro/orbito:latest
docker run --rm --network none -v "${PWD}:/project" ghcr.io/uncool-pro/orbito:latest update
docker compose up -d
```

The update changes the same things as always (Orbito's skills, agents and commands in `.claude/`, `.orbito/models.json`, `.orbito/managed.json`) plus `compose.yaml`, which pins the new version. Your screens, flows and design system are not touched. `docker compose up -d` then restarts the board on the new version. Each project keeps the version in its `compose.yaml` until you update it, so a team stays in step by committing that file.

## Move an existing project to Docker

Run the two update commands above in the project folder. It adds `compose.yaml` and marks the project as running in Docker (`.orbito/runtime`). The project's `node_modules` is no longer used and can be deleted. To go back, write `local` into `.orbito/runtime` and run `npm install`.

## When something does not work

- **The `docker` command is not found, though Docker Desktop is installed:** this window started before the installation and does not know the new path yet. Close it and open a new one. On Windows, Claude can also find the command in `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin` or `C:\Program Files\Docker\Docker\resources\bin`.
- **Docker says it cannot connect:** Docker Desktop is closed, or still starting. Open it and wait for "Engine running".
- **Windows asks for administrator rights or a restart while Docker is being installed:** that is the first start of WSL, the small Linux Docker runs on. It happens once. On a company computer it may need your IT department.
- **Port 5190 is taken, or the board shows another project:** another project's board is running. `docker compose down` there, or stop `npm run dev`. Note that `npm run dev` and the container can both start at once without an error, and the browser then shows only one of them.
- **A font or a picture is missing on the board:** it comes from the internet. Put the file in `public/`.
- **"cannot resolve" for a package:** the project imports a package that is not in the image. Build it from the design system instead, or use the "from the code" way.
- **A folder outside the list in `compose.yaml`:** if screens import from another top-level folder, add it to `volumes` of `renderer` and `tools`, read-only. The next update reports your edit and keeps a copy in `.orbito/backup/`.

## For Claude

The person may not be technical. Say what is happening in plain words, one step at a time, tell them exactly what to click, and do not ask about things you can check yourself. Installing Docker Desktop and changing system settings is theirs to do: give them the link, wait until they say it is open, then carry on.

Check `.orbito/runtime` at the start of a session. If it says `docker`:

- Use the Docker commands from "Every day" wherever a skill or document says `npm run …` or `npx --no orbito …`.
- Never run `npm install`, `npm run dev` or `npx` in the project.
- To update, use the commands in "Update", in full.
- If the person wants a package the image does not have, do not work around it: say so and offer to build it in the design system.

Without that file, or if it says `local`, the project runs from the code.
