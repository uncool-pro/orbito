---
name: synthetic-usability
description: Quick synthetic usability signals in Orbito — a small swarm of personas from the target group looks at the screens and UX writing and says what is unclear; the UX designer then defends or fixes, and a person decides. Not usability testing and not research. Use after the UI audit, before showing screens to a client, or when someone asks "would people understand this?".
---

# Synthetic usability check

A cheap early warning, not evidence. Real users are not replaced; findings are signals for the UX designer.

## Personas
Built from the target group recorded at the kickoff (`.orbito/process.md`). 5–8 personas that differ in what matters for this product: experience with similar products, how often they use it, what they want to achieve, what they are afraid of, context (on the go, at a desk). Save them in `.orbito/personas.md` and keep them for the whole project; refine them when the team learns about real users.

## Running it
- Give each persona one task from a flow ("water a plant that is due today") and the screens of that flow, one at a time (the screen view `#/s/<code>`, its text and structure).
- Each persona (the `synthetic-user` agent, light model) answers per screen: what do I think this screen is for; what would I do next; what is unclear or worrying; which words do I not understand.
- Collect answers into a table: screen, persona, signal, quote.

### On a landing page
First the five-second test: each persona sees only the first screenful (desktop and `mobile-web`) and says what this is, who it is for and what they would do next. Then the whole page: where they would stop reading, what is unclear, what would stop them from saying yes, which words they do not understand. Signals about the words go to the `copywriter` as well as the `ux-designer`.

## After
The `ux-designer` goes through the signals with `ux-design` → `references/review.md`: fix, defend (with the reason), or ask. Personas are often wrong — they do not know technical limits or product decisions. The human UX designer decides; decisions go to `.orbito/process.md`.

## Report
`reviews/<date>-synthetic-users.md`: personas used, tasks, signals grouped by screen, and the decision for each.
