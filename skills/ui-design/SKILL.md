---
name: ui-design
description: UI designer's high-fidelity screens in Orbito — once the project design system is approved, screens are built or migrated from the lo-fi kit to the design system's components with real visual hierarchy, states and content, and the design system grows where screens need it. Use after the design system is approved, when lo-fi screens wait for migration, and when a screen needs visual design rather than structure.
---

# UI design (hi-fi screens)

**Role:** UI designer (the prototyper may do the building on a lighter model). **Comes after:** look & feel → design system. **Comes before:** UI audit, accessibility audit, synthetic users.

The UX designer decides structure and behaviour; the UI designer makes each screen look and read the way the approved direction intends. From the moment the design system is approved, new screens are built on it straight away, and the lo-fi screens built earlier go on a migration list.

## Migrating a lo-fi screen
1. Keep its structure, links, states and copy; replace each lo-fi component with the design system's equivalent (same names and props where the role is the same, so most screens switch without edits).
2. Apply the visual hierarchy of the direction: the most important thing is the most prominent (size, weight, colour, position); one primary action per area; secondary information visibly quieter.
3. Check every state the screen has (empty, loading, error, long values, many items) with the new components.
4. A need the design system does not cover → add it to the system (`design-system`) with docs and variants, then use it. Never style a screen locally.
5. Mark the screen as migrated in `.orbito/process.md`; a screen someone already approved changes in a version of its flow.

## Designing a new screen in hi-fi
Start from the UX spec (`wireframes`), then build it directly on the design system with the same steps 2–4.

## Done means
- No lo-fi kit components left on migrated screens (`npm run check:ds` reports them).
- Every screen holds with real content and in every state, on every viewport it declares.
- The design system catalog (`#/ds`) documents everything the screens use.
