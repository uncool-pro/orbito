---
name: wireframes
description: UX designer's screen design in Orbito — a short spec for every screen in the flows (purpose, content in order, actions, states, stories) and the functional mockups built from it, on the lo-fi kit until the project design system is approved and on the design system after that. Use when flows need screens, when a screen is missing or unclear, and whenever mockups are designed or changed on the UX side.
---

# Wireframes (screen design)

**Role:** UX designer designs; the prototyper may build from the spec on a lighter model. **Comes after:** user flows. **Comes before:** UX review, then look & feel or UI design.

## Spec first
For every screen in the flows, before building it, write a short spec (in the screen file's comment or as a list for the prototyper):
- **Purpose**: the one thing the person comes here to do.
- **Content**, in order of importance: what they need to see first, second, later.
- **Actions**: primary (one), secondary, destructive (with confirmation); where each one leads (screen id).
- **States**: empty, loading, error, partial data, long values. Each state that looks different is its own screen in a flow (usually alternative or negative).
- **Stories** it covers (`requirements: ['REQ-..']`); add the screen code to each story's `Screens:` line and to `requirements/coverage.md`.

## Building
- One file per screen: `screens/<area>/<id>.screen.tsx`, `meta` with a permanent `code`, a `title` like `Area / Screen`, `back`, `requirements`, `viewport` when it is not the default.
- Mobile: `DeviceScreen` with `top` (app bar), `bottom` (tab bar or actions), `overlay` (floating button), `modal` (sheet, dialog). Web: `PageScreen`.
- Only design-system components; data in a local `data.ts` per area, fictional and realistic (real lengths, edge cases).
- After building: `npm run check:ds`, `npm run typecheck`, and look at the board and the flows diagram.

## Lo-fi or design system
- **No approved design system yet** → build from the lo-fi kit (grey, functional): real structure, real copy, real states, no visual polish.
- **Design system approved** (see `.orbito/process.md`) → build new screens on it straight away; missing components are added to it first (`design-system`), never drawn ad hoc. Older lo-fi screens go on a migration list for `ui-design`.

## Words
Labels, errors and empty states are part of the wireframe: write them with `ux-writing`, never lorem ipsum.

## Done means
- Every screen in the flows exists, with its spec covered and its stories referenced.
- `#/flows` shows no dead ends or steps without a link; `npm run check:ds` passes.
- A change to screens someone already reviewed is a version of the flow, with what changed and why.
