---
name: wireframes
description: UX designer's screen design in Orbito — a short spec for every screen in the flows (purpose, content in order, actions, states, stories) and the functional mockups built from it, on the lo-fi kit until the project design system is approved and on the design system after that. Use when flows need screens, when a screen is missing or unclear, and whenever mockups are designed or changed on the UX side.
---

# Wireframes (screen design)

**Role:** UX designer, who designs and builds the screens in code. **Comes after:** user flows. **Comes before:** UX audit (`ux-audit`, by the design auditor), then look & feel or UI design.

## Spec first
For every screen in the flows, before building it, write a short spec (in the screen file's comment):
- **Purpose**: the one thing the person comes here to do.
- **Content**, in order of importance: what they need to see first, second, later.
- **Actions**: primary (one), secondary, destructive (with confirmation); where each one leads (screen id).
- **States**: empty, loading, error, partial data, long values. Each state that looks different is its own screen in a flow (usually alternative or negative).
- **Stories** it covers (`requirements: ['REQ-..']`); add the screen code to each story's `Screens:` line and to `requirements/coverage.md`.

## Building
- One file per screen: `screens/<area>/<id>.screen.tsx`, `meta` with a permanent `code` (see "Screen codes"), a `title` like `Area / Screen`, `back`, `requirements`, `viewport` when it is not the default.
- Mobile and tablet: `DeviceScreen` with `top` (app bar), `bottom` (tab bar or actions), `overlay` (floating button), `modal` (sheet, dialog). Web: `PageScreen` with `top` (header, navigation bar), `side` (side navigation, filters, a drawer; `sideAt: 'right'` for the other edge), `bottom` (sticky actions, a cookie bar), `overlay` (chat button, toast), `modal` (dialog).
- **What stays in place while scrolling is the frame, not the content.** Every screen is seen through a window exactly the viewport's size (a phone, a browser) and only the content scrolls — on the board and in the prototype, like the real product. Everything that must not move goes into the slots above. Something that sticks only once you scroll to it (a section's tabs, a table header) is `position: sticky` inside the content. Never build a fixed bar or a side panel as part of the long content (it would scroll away with it), and never stretch a screen taller than its viewport to show the whole page: people scroll it in the prototype.
- Only design-system components; data in a local `data.ts` per area, fictional and realistic (real lengths, edge cases). Something the kit or the design system lacks is added there first (or marked `// ds-exception: <why>` with the person's agreement), never styled ad hoc in the screen.
- After building: `npm run check:ds`, `npm run typecheck`, and look at the board and the flows diagram.

## Screen codes and names
- **Name** (the last part of the title) says what happens on the screen, in the users' words, up to about six words: `Plants / Edit watering reminder`, not `Plants / Screen 3`. People read the name; the code is for references.
- **Code** = `<AREA>-<NN>`: the area's prefix from the information architecture (two letters, three if two would clash) and a two-digit number in the order screens are created in that area: `PL-01`, `PL-02`.
- **Per area, not per feature:** one screen often serves several features (a detail screen in "water a plant" and in "water from the schedule"), and features change with the requirements; the areas of the information architecture are the most stable thing in the project. A single global sequence (`S1, S2…`) says nothing about where a screen lives and grows without limit.
- **Permanent:** never renumber. A new screen takes the next free number in its area; a deleted screen's number is not reused; a screen moved to another area keeps its code (stories, tickets and chats already point to it).
- **Versions** of a screen under review: `PL-02·A`, `PL-02·B`. **Features** (flows) have their own short keys within the page (`P1`, `P2`).
- The team already numbers screens its own way (tracker IDs, a design-file convention)? Use theirs and note it in `.orbito/process.md`.

## Lo-fi or design system
- **No approved design system yet** → build from the lo-fi kit (grey, functional): real structure, real copy, real states, no visual polish.
- **Design system approved** (see `.orbito/process.md`) → build new screens on it straight away; missing components are added to it first (`design-system`), never drawn ad hoc. Older lo-fi screens go on a migration list for `ui-design`.

## Words
Labels, errors and empty states are part of the wireframe: write them with `ux-writing`, never lorem ipsum.

## Done means
- Every screen in the flows exists, with its spec covered and its stories referenced.
- `#/flows` shows no dead ends or steps without a link; `npm run check:ds` passes.
- A change to screens someone already reviewed is a version of the flow, with what changed and why.
