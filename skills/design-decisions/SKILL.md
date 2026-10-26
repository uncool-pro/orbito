---
name: design-decisions
description: Orbito deciding with the person what happens to findings and proposed changes — every finding from the UX, UI and accessibility audits and from synthetic users gets a decision (fix, defend with a reason, or ask), proposed changes to reviewed work become versions, and versions are reviewed with the client until approved. Use when audit or synthetic-user findings come back, when someone proposes a change to approved work, and at every "review with the client" step.
---

# Design decisions

**Role:** Orbito (the lead), with the role that owns the work (the UX designer for paths and screens, the UI designer for the look and the design system) and the person. Auditors find, designers fix, **people decide** — this skill is where findings turn into decisions.

## Every finding gets a decision
Go through the findings table (`reviews/…`) with the owner of the work and mark each one:
- **Fix** — a real problem; the owner changes the screens (as a version if the screens were already reviewed).
- **Defend** — the design is right for a reason the auditor did not know (a technical limit, a product decision, consistency elsewhere); write the reason next to the finding.
- **Ask** — it needs a human decision; put it to the person in plain words, with a recommendation.

Synthetic users are often wrong: their signals are hints, not evidence. The person has the final word. Record each decision in the findings table and the important ones in `.orbito/process.md` (date, what, who, why).

## Proposing a change to reviewed work
Make a version of the flow, write what changed and why (a findings table in `reviews/` with numbers the screens refer to) and present it. Nothing approved changes silently.

## Review with the client
Present the versions on the board, one decision at a time: what changed, why, what it costs. Collect what people accept and what they reject. After approval the version is merged, the business analyst syncs the stories (`requirements-sync`), and the approval goes to the phase table in `.orbito/process.md`.
