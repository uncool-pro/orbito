---
name: ux-design
description: UX design in Orbito — from user stories to information architecture, flows (happy, alternative, negative paths), screen specs and mockups; challenging stories that work on paper but not on screen; corrective review after each stage; defending or accepting findings from audits and synthetic users. Use for any work on structure, navigation, flows, screens or UX review, and whenever a story is turned into screens.
---

# UX design

The UX designer turns what we want to build (stories) into how people will get it done (structure, paths, screens) — and questions the stories on the way. Order of work, each stage reviewed before the next:

1. **Information architecture** → `references/information-architecture.md`
2. **Flows**: happy path, then alternative paths, then negative paths → `references/flows.md`
3. **Screen specs**: for every screen in the flows, what is on it and why → `references/screens.md`
4. **Mockups**: built by the `prototyper` from the specs — lo-fi kit until the project design system is approved, then the design system → `references/screens.md`
5. **Review** of each stage, and later of audit and synthetic-user findings → `references/review.md`

## Principles
- **Stories say what to build, not how it works on screen.** Read them, then design the path a person takes. What looks fine in a story often works badly on a screen; say so and propose the better way (it becomes a version the people decide on).
- **Think as the person using it.** Build a persona from the target group and walk the path in their shoes: what do they know at this point, what do they want next, what would make them stop.
- **Fewer steps, but not at any price.** Remove steps that add nothing; keep the ones that prevent mistakes or explain.
- **Destructive actions get a double confirmation** (an explicit confirm step, and a way back where possible).
- **The flow is a helper, the mockups are the master.** Flows give the big picture early; once mockups exist, the flows diagram in Orbito is generated from them and never redrawn by hand.
- **Design for the people, decide with the people.** Findings from audits and synthetic users are signals. Defend design decisions that have good reasons (technical limits, product strategy); fix what is a real problem; the human UX designer decides.

## Lo-fi or design system
- No approved design system yet → build mockups from the lo-fi kit (grey, functional). They are for structure and behaviour, not looks.
- Design system approved (see `.orbito/process.md`) → all new screens use it; missing components are added to it (by the prototyper, following `design-system`), never drawn ad hoc. Older lo-fi screens go on a migration list.

## Done means
- Every story in scope is covered by a flow and screens, or there is a written reason why not.
- Happy, alternative and negative paths exist for every flow that can fail or branch.
- `#/flows` shows no dead ends, unreachable screens or flow steps without a link; `npm run check:ds` passes.
- Every change to reviewed screens is a version, with what changed and why.
