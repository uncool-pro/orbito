---
name: user-flows
description: UX designer's user flows in Orbito — the path a person takes to get something done, drawn by UX (not taken from the story): happy path first, then alternative paths, then negative paths with errors and no dead ends; one goal per flow, built from the analyst's stories and linked to them both ways. Use after the information architecture, whenever a story or task has to become a path, and when the flows diagram shows dead ends or unreachable screens.
---

# User flows

**Role:** UX designer. **Comes after:** information architecture (and the stories). **Comes before:** wireframes.

A flow is the path a person takes to get something done. It does not come from the story; the UX designer draws it and questions the story on the way ("what looks fine in a story often works badly on a screen"). In Orbito a flow is a list of screens in `flows/*.flow.ts` with a `path`, and the diagram at `#/flows` is generated from the links in the screens.

## Order
1. **Happy path** (`path: 'happy'`): the shortest sensible way to the goal when everything goes right.
2. **Alternative paths** (`path: 'alternative'`): other ways round and interruptions — entering from another place (a reminder, a link, another tab), skipping a step, coming back later, changing your mind. Ask: where else can the person be around this path, and which interactions take them out of it?
3. **Negative paths** (`path: 'negative'`): what happens when something fails — errors, no connection, no permission, empty data, timeouts, cancelling half way. Every negative path ends somewhere useful: retry, a way back, or a clear next step. No dead ends.

## Building them
- Start with a list of screen ids per flow; the screens come as wireframes.
- **Link the stories as you draw.** The analyst's documentation (`requirements/`) is your input: draw each flow from the stories it delivers and attach them to the flow, `requirements: ['REQ-03', 'REQ-04']`. Then write the flow back into each story (`Flows:` line in `requirements/<area>.md`).
- **Flag both directions**, for the person and the analyst: a story no flow delivers (not designed yet, or forgotten), and a flow or path no story asks for (often a good idea — then it becomes a new story, after the people decide). Negative paths need stories too: errors are behaviour; ask the analyst for the missing criteria.
- Keep a coverage table in `requirements/coverage.md`: `| Story | Flows | Screens | Status |` (screens are added in `wireframes`).
- Links: `to` / `back` on design-system components; errors and automatic moves with `<Transition to on label />`, so negative paths are drawn too.
- Keep one goal per flow. If a flow needs "and also", it is two flows.

## Principles
- **Think as the person using it.** Build a persona from the target group and walk the path in their shoes: what do they know at this point, what do they want next, what would make them stop.
- **Fewer steps, but not at any price.** Remove steps that add nothing; keep the ones that prevent mistakes or explain.
- **Destructive actions get a double confirmation** (an explicit confirm step, and a way back where possible).
- **The flow is a helper, the wireframes are the master.** Once screens exist the diagram follows them; never maintain a separate drawing.

## Checking (before showing anyone)
- Walk each path as the persona. Count the steps; question each one.
- `#/flows`: no dead ends, no unreachable screens, no flow step without a link. Alternative and negative paths join the happy path again or end with a clear outcome.
- Each flow can be explained in one sentence, and every story in scope is attached to at least one flow.

## Pages
For a landing page the flow is a funnel of sections on one page, not a path between screens: see `process-landing-page` → "Funnel of sections".
