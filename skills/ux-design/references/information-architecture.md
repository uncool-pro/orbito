# Information architecture

**Goal:** the right navigation and the right place for every function — the result a card-sorting study aims for — before any flow is drawn. Teams often skip this and work it out while drawing screens; do it explicitly, it is cheap at this stage and expensive later.

## How
1. List the content and functions from the stories (nouns: what people see; verbs: what they do).
2. Group them the way the **users** think, not the way the system or the org chart is built. Name groups with words users would use.
3. Decide the top level (tabs, main menu): 3–5 on mobile, up to ~8 on web. Everything else nests under them, at most two levels deep for frequent tasks.
4. Place each function where people will look for it first; frequent tasks closest to the top.
5. Write the result as a tree (markdown list) with a one-line reason for each top-level group; save it under `requirements/` or in the flow file's comment, and link it from `.orbito/process.md`.

## Checks
- Can a first-time user say where to find the three most frequent tasks? Walk it as the persona.
- Does any group mix things that belong to different moments of use? Split it.
- Is anything grouped by technical reasons (backend structure, data source) instead of meaning? That is the most common mistake.

## Example (fictional)
Stories describe one long list of notifications in categories that mirror the backend (orders, system, payments, account). Users look for "what needs me today". Better: group by what the notification asks of the person — *to do*, *for information*, *problems* — with the original category as a label inside. The story is not wrong; the structure on screen is a UX decision, proposed as a version.
