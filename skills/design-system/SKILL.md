---
name: design-system
description: Building and keeping the project design system in Orbito — tokens with usage notes, components by atomic level with docs and variants, importing an existing system from code or a design tool, replacing the lo-fi kit with the project's components, and passing npm run check:ds. Use when a look & feel is approved, when a team brings existing components or brand files, when a screen needs a component that does not exist, or when check:ds reports problems.
---

# Design system

The design system is where every visual decision lives. Screens only combine its components; they never style things themselves. The UI designer owns it; the UX designer adds to it following these rules when a screen needs something new.

## Sources, in order of trust
1. Code of existing components (any technology: React, React Native, Vue, Flutter…) — exact values.
2. Design-tool files (Figma variables and components, through a connector if available).
3. Brand guidelines, the approved look & feel.
4. Screenshots — last resort, values are estimates and must be marked as such.

## Building it
1. **Inventory first.** List everything the source has: colours, type styles, spacing, radius, elevation, motion, components and their variants. Keep the list; report what is not done yet at the end.
2. **Tokens** in `design-system/tokens.json`: groups of `{ name, value, usage }`; text colours list the backgrounds they sit on (`on`) so contrast is checked; exact values, never "close enough". Every token says when to use it.
3. **Components** by level: atoms (from tokens) → molecules (from atoms) → organisms (from molecules) → templates (page layouts). A component never imports from a higher level. Same names and props as the lo-fi kit where the role is the same, so screens switch without edits.
4. **Docs** next to every component (`<Name>.docs.tsx`): what it is for, do / don't, and every variant and state it has.
5. **Export** from `design-system/index.ts`. Run `npm run check:ds` until it reports 0 errors and 0 warnings; check the catalog at `#/ds`.

## Importing from another technology
Rebuild components in the project's mockup stack (React + TypeScript + tokens), keeping names, variants, states and values. Write a mapping table (source component → Orbito component → differences) in `design-system/import-log.md`. Do not wrap the original code.

## Replacing the lo-fi kit
After the look & feel is approved, replace kit components one by one under the same names; `npm run check:ds` and the catalog show where each is used, so you can check the affected screens on the board. Note progress in `.orbito/process.md`.

## Adding a component later
Check the catalog first — most needs are a variant of something that exists. If it is new: right level, tokens only, docs with variants, then use it in the screen.

## Quality bar
- No raw values outside `tokens.json`; contrast passes WCAG AA for every declared text/background pair.
- Visual hierarchy is built into the scale: sizes and weights step clearly; the most important text is the largest and heaviest.
- Every component in the catalog has a description, guidelines and all its variants.
