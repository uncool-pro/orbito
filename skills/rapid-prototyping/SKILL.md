---
name: rapid-prototyping
description: Quick, clickable prototype that shows a client what we are about to build — the business analyst reads whatever input there is (a long brief, a backlog, a few notes) and picks the one or two happy paths that show the concept best; then UX and the prototyper build just those, on the lo-fi kit or the project design system. Use when someone needs a prototype or concept "for a meeting", "to show the client", "quickly", or when a project starts as a quick prototype.
---

# Rapid prototyping

A rapid prototype answers one question for the client: *is this what we are building?* It is not the full design. It shows the main idea on the smallest set of screens that makes the idea clear, clickable in the browser.

> Beta: this skill covers scoping and building. The full rapid-prototyping process from practice (more stages and hand-offs) is being added.

## 1. Scope it (business analyst)
The input can be anything: a long specification, a backlog, a call transcript, three bullet points.
- Read all of it. Summarise in 3–5 sentences what the product is, for whom, and what makes it valuable.
- List the candidate happy paths (main tasks that end with the person getting value).
- **Pick one, at most two**, that show the client the concept best: the task that carries the core value, and if needed a second one that shows something the client is unsure about. Say why each was picked and what was left out.
- For each chosen path: the steps, the screens it needs (aim for 3–7), the key content per screen, and the assumptions you made because the input was silent.
- If the input is too thin to choose (no idea who the user is or what the core value is), ask the person 1–2 questions instead of guessing.
Bring the proposal to the person and get a yes before building.

## 2. Build it (ux-designer → prototyper)
- One flow per chosen path (`path: 'happy'`), screens from the specs; skip alternative and negative paths unless the client asked about a specific failure.
- Lo-fi kit unless a design system or brand already exists and the client expects the look.
- Real, believable content (fictional names and data, realistic lengths). Placeholder text kills a prototype.
- Make every step clickable from start to finish in prototype mode (`#/s/<first screen>`), and check `#/flows` shows no dead ends.

## 3. Show it
- Open the first screen in prototype mode and walk the path; the board shows the whole path at once for discussion.
- Collect what the client says; changes go into a version of the flow so the original stays for comparison.
- Record in `.orbito/process.md`: what was shown, to whom, what was decided, what is next (a full design, another iteration, or stop).

## Quality bar
- The whole path is clickable and tells a story without explanation.
- Every assumption the analyst made is written down and was either confirmed or marked as open.
- Small: if it grows past ~10 screens, it is not a rapid prototype anymore — say so and propose the full process.
