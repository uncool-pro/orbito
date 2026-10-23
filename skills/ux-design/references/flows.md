# Flows

A flow is the path a person takes to get something done. It does not come from the story; the UX designer draws it. In Orbito a flow is a list of screens in `flows/*.flow.ts` with a `path`, and the diagram at `#/flows` is generated from the links in the screens.

## Order
1. **Happy path** (`path: 'happy'`): the shortest sensible way to the goal when everything goes right.
2. **Alternative paths** (`path: 'alternative'`): other ways round and interruptions — entering from another place (a reminder, a link, another tab), skipping a step, coming back later, changing your mind. Ask: where else can the person be around this path, and which interactions take them out of it?
3. **Negative paths** (`path: 'negative'`): what happens when something fails — errors, no connection, no permission, empty data, timeouts, cancelling half way. Every negative path ends somewhere useful: retry, a way back, or a clear next step. No dead ends.

## Building them
- Start with a list of screen ids per flow; create screens as specs first (see `screens.md`), then mockups.
- Links: `to` / `back` on design-system components; errors and automatic moves with `<Transition to on label />`, so negative paths are drawn too.
- Keep one goal per flow. If a flow needs "and also", it is two flows.

## Checking (before showing anyone)
- Walk each path as the persona. Count the steps; question each one.
- `#/flows`: no dead ends, no unreachable screens, no flow step without a link. Alternative and negative paths join the happy path again or end with a clear outcome.
- Destructive actions: double confirmation and, where possible, a way to undo.
- Each flow can be explained in one sentence.

## After mockups exist
The flows diagram updates itself from the screens. Do not maintain a separate drawing; change screens and links, and the diagram follows.
