# Screen specs and mockups

## Spec first
For every screen in the flows, before building it, write a short spec (in the screen file's `meta.note` or a comment, or as a list for the prototyper):
- **Purpose**: the one thing the person comes here to do.
- **Content**, in order of importance: what they need to see first, second, later.
- **Actions**: primary (one), secondary, destructive (with confirmation); where each one leads (screen id).
- **States**: empty, loading, error, partial data, long values. Each state that looks different is its own screen in a flow (usually alternative or negative).
- **Stories** it covers (`requirements: ['REQ-..']`).

## Building (prototyper)
- One file per screen: `screens/<area>/<id>.screen.tsx`, `meta` with a permanent `code`, a `title` like `Area / Screen`, `back`, `requirements`, `viewport` when it is not the default.
- Mobile: `DeviceScreen` with `top` (app bar), `bottom` (tab bar or actions), `overlay` (floating button), `modal` (sheet, dialog). Web: `PageScreen`.
- Only design-system components; data in a local `data.ts` per area, fictional and realistic (real lengths, edge cases).
- After building: `npm run check:ds`, `npm run typecheck`, and look at the board.

## Level of detail
- Lo-fi kit: real structure, real copy, real states; no visual polish.
- Design system: everything as it will look; the UI designer audits it.

## Copy
Write the real words, not lorem ipsum: labels start with verbs, errors say what happened and what to do, empty states say why and what next.
