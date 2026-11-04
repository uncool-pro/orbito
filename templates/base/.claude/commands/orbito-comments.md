---
description: Go through the open comments on the screens and make the changes they ask for
---

Go through the comments people left on the screens: one file per comment in `comments/<screen-id>/` (format in the `orbito-workspace` skill). $ARGUMENTS can name screens (`PL-01`, `plant-list`) to limit the pass; otherwise take every comment with `status: open`, oldest first (`created`).

1. List the open comments first: screen, what each asks for, and anything unclear. If a comment is unclear or asks for a decision (scope, direction, something that changes an approved screen), ask me before touching it and leave it `open`.
2. For each one you take, set `status: doing` before you start, so the board shows it is in progress.
3. Make the change by the project's rules: design-system components and tokens only, and a reviewed or approved screen becomes a version of its flow, not a silent edit.
4. When it is made, set `status: done` and add a line `note: <what you changed, one line>` to the front matter. Never change a comment's text and never delete a comment file: the person does that on the board.
5. Run `npm run check:ds` and `npm run typecheck` (in Docker: `docker compose run --rm tools check ds` and `… typecheck`), then tell me what you made, screen by screen, and which comments you left open and why.
