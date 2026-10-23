# Demo application: Leafy

A fictional plant-care app, built the way Orbito expects a project to be built. Use it to see what the tool does and as the reference structure for your own project: everything it needs is in this one folder.

```sh
npm install
npm run dev          # http://localhost:5190
npm run check:ds     # design-system rules
```

Open `#/board` for the flows, `#/ds` for the design system, `#/s/PL-01` for a single screen.

## What is inside

```
demo/
  orbito.config.ts             project settings: title, language, default viewport
  index.html, src/main.tsx     entry point (mounts the viewer; nothing to change here)
  vite.config.ts               Vite + the Orbito plugin    
  design-system/
    tokens.json                every value: colours, type, spacing, radius, elevation, motion — each with a usage note
    atoms/                     Text, Icon, Button              (built from tokens)
    molecules/                 ListItem, Field, PlantThumb     (built from atoms)
    organisms/                 AppBar, TabBar                  (built from molecules and atoms)
    <Component>.docs.tsx       description, do / don't, variants — shown in the catalog
    index.ts                   the only entry point screens import from
  screens/
    plants/  account/  admin/  one file per screen: <id>.screen.tsx with `meta` (code, title, viewport…)
    data.ts                    fictional data shared by screens
  flows/                       pages and flows of the board; a flow can have versions (e.g. after a UX review)
  reviews/                     reports that versions point to (findings #1, #2 … appear on the board)
  .orbito/status.json          screen statuses, written from the board
```

What it shows:

- **Mobile and web in one project:** the app screens use the `mobile` viewport, the admin screens `desktop`.
- **Links drawn once:** buttons and rows take `to="<screen id>"`; the board finds the arrows itself.
- **A review version:** flow P1 has a version "After UX review" with a reworked detail screen (`plant-detail-v2`) tied to findings in `reviews/2026-10-ux-review.md`.
- **A design system that passes every rule:** `npm run check:ds` reports 0 issues; add `color: '#ff0000'` to any screen to see a rule fire.

## Removing the demo

When you start your own project, ask Claude: "remove the demo application". The steps are in the repository `CLAUDE.md` ("Demo application").
