---
description: Go through the open comments on the screens and make the changes they ask for
---

Go through the comments people left on the screens, in `comments/<screen-id>.md` (one file per screen; format in the `orbito-workspace` skill). $ARGUMENTS can name screens (`PL-01`, `plant-list`) to limit the pass; otherwise take every `## open` comment.

1. List the open comments first: screen, what each asks for, and anything unclear. If a comment is unclear or asks for a decision (scope, direction, something that changes an approved screen), ask me before touching it and leave it `open`.
2. For each one you take, change its heading to `## doing · <id>` before you start, so the board shows it is in progress.
3. Make the change by the project's rules: design-system components and tokens only, and a reviewed or approved screen becomes a version of its flow, not a silent edit.
4. When it is made, change the heading to `## done · <id>` and add ` · note: <what you changed, one line>` to the line under it (after the author and date). Never delete a comment and never change its text: the person does that on the board.
5. Run `npm run check:ds` and `npm run typecheck` (in Docker: `docker compose run --rm tools check ds` and `… typecheck`), then tell me what you made, screen by screen, and which comments you left open and why.
