---
name: ui-design
description: UI designer's high-fidelity screens in Orbito — once the project design system is approved, screens are built or migrated from the lo-fi kit to the design system's components with real visual hierarchy, states and content, and the design system grows where screens need it. Use after the design system is approved, when lo-fi screens wait for migration, and when a screen needs visual design rather than structure.
---

# UI design (hi-fi screens)

**Role:** UI designer, who also builds the screens in code. **Comes after:** look & feel → design system. **Comes before:** UI audit, accessibility audit, synthetic users.

The UX designer decides structure and behaviour; the UI designer makes each screen look and read the way the approved direction intends. Work starts only after the look & feel exploration is **closed** (one direction kept, the other variants removed, the choice recorded in `.orbito/process.md`); if variants are still open on the board, propose closing them first (`look-and-feel`, "Close the exploration") instead of refining one of them. From the moment the design system is approved, new screens are built on it straight away, and the lo-fi screens built earlier go on a migration list.

## Migrating a lo-fi screen
1. Keep its structure, links, states and copy; replace each lo-fi component with the design system's equivalent (same names and props where the role is the same, so most screens switch without edits).
2. Apply the visual hierarchy of the direction: the most important thing is the most prominent (size, weight, colour, position); one primary action per area; secondary information visibly quieter.
3. Check every state the screen has (empty, loading, error, long values, many items) with the new components.
4. A need the design system does not cover → add it to the system (`design-system`) with docs and variants, then use it. Never style a screen locally.
5. Mark the screen as migrated in `.orbito/process.md`; a screen someone already approved changes in a version of its flow.

## Designing a new screen in hi-fi
Start from the UX spec (`wireframes`), then build it directly on the design system with the same steps 2–4.

## Every visual change lands in the design system
When a screen needs something the design system does not have, or wants it to look different (a new style, a new state, other spacing), never solve it only in the screen — that is how a design system quietly stops being true. Stop and ask the person, in plain words, with a recommendation:
1. **Change the component** in the design system — every screen using it changes too; say how many (the catalog lists them).
2. **Add a variant** of it — the screens that use the current look keep it.
3. **Keep it as a one-off exception** on this screen — mark it with `// ds-exception: <why>` on the line above, so `npm run check:ds` lists it in Health with its reason instead of failing.
Usually 1 or 2. On a branch where something is being tried out, an exception is fine until the experiment is decided; when it is merged, ask again. After every visual change run `npm run check:ds`: a new error or warning means something bypassed the design system — settle it with the person the same way.

## Done means
- No lo-fi kit components left on migrated screens (`npm run check:ds` reports them).
- Every screen holds with real content and in every state, on every viewport it declares.
- The design system catalog (`#/ds`) documents everything the screens use.
