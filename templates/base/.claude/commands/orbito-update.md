---
description: Update Orbito from GitHub and refresh this project's skills, agents and commands
---

Update Orbito for this project:

1. Run `npm run update` — the whole command, never only a part of it (that is `orbito update --pull`; in a project without that script yet, run `npx --no orbito update --pull` — it adds the script): it pulls the newest Orbito from GitHub into the Orbito folder this project links to, installs it, and refreshes the Orbito skills, agents and commands in `.claude/`. My screens, flows, design system, `.orbito/process.md`, `status.json` and `raw/` are not touched; skills or agents I added myself stay. If it reports edits of Orbito's skills saved to `.orbito/backup/` or a conflict with one of my skills' names, tell me in plain words what that means and what to do.
2. If it says the Orbito folder is not a git clone, show me its steps and ask before moving or cloning anything.
3. Read the new entries in Orbito's `CHANGELOG.md` (in the Orbito folder) since the version I had, and tell me in plain words what changed for me: new views, new skills, changed process. If an entry adds something to the project template (for example new base components), ask whether to add it to this project; never apply template changes on your own.
4. Restart `npm run dev` if it is running, so the new viewer loads, and write one line under "Decisions" in `.orbito/process.md`: the date and the Orbito version now in use.
