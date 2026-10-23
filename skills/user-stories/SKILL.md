---
name: user-stories
description: Business analyst's functional requirements in Orbito — checking, verifying, completing (or taking as is) the requirements the person brings, asking about gaps, and writing epics (high-level stories) split into user stories with acceptance criteria testers can check and developers can build from, written by good-practice rules (INVEST, given/when/then, splitting, definition of ready) into requirements/*.md, the local mirror of the team's tracker. Use when stories are missing, too vague, too big or untestable, after a client workshop, or when someone asks what exactly we are building.
---

# User stories

**Role:** business analyst. **Comes after:** the kickoff (and a workshop with the client when the idea is unclear). **Comes before:** information architecture and user flows (UX).

The analyst gathers functional requirements from the client (workshop, interviews with stakeholders) and writes them down. The analyst understands the technology, so requirements are realistic — but does not validate them with users and does not design screens. Challenging requirements from the user's point of view is the UX designer's job.

## Start from what the person brings
Often requirements already exist in some form: a backlog export, a specification, notes from a workshop, a brief (sorted from `raw/` at the kickoff). Do not rewrite them for the sake of it. For each source:
- **Check** it against the rules below (form, testable criteria, edge cases, rules, open questions).
- **Verify** it is consistent: contradictions between documents, duplicates, stories that no longer match what the client said.
- **Ask** the person (1–2 questions at a time) when something is missing or contradictory; never invent business rules.
- **Complete** what is missing — criteria, errors, rules — and mark what you added so the client can confirm it.
- **Take it as is** when it is good enough, or when the person says so; say what you would improve, once.
With no requirements at all, gather them with the person (or propose a workshop with the client) before UX starts.

The result is the documentation the UX designer works from: flows and screens are built from it, and the UX designer links the stories to them.

Stories are read by three groups, so they must work for all three:
- **the UX designer** — what to design and why (input, not a specification of the screens);
- **developers** — what to build and the rules it must follow;
- **testers** — exactly what to check.

## Levels
- **Epic** (a high-level story): a large goal for one kind of user, e.g. *"Plant owners keep their plants watered without remembering it themselves."* Too big to build or test at once; it groups stories.
- **Story**: one behaviour a user can see and that is worth something on its own. Small enough to design, build and test in a few days.
- **Acceptance criteria**: the conditions that make the story done, each one testable.

## A good story (INVEST)
- **Independent** — can be delivered without waiting for another story where possible.
- **Negotiable** — says *what* and *why*, leaves *how it looks* to UX ("story ≠ design").
- **Valuable** — the "so that" names a benefit for the user or the business, not a technical step.
- **Estimable** — developers can size it; unknowns are listed as open questions.
- **Small** — fits a few days; otherwise split it.
- **Testable** — every acceptance criterion can be checked with a yes/no.

Form: **As a** \<specific user\>, **I want** \<goal in their words\>, **so that** \<benefit\>. The user is a real role from the target group ("a plant owner with many plants"), never "the user" or "the system".

## Acceptance criteria
- Write them as **given / when / then**, one behaviour per criterion:
  > Given a plant with a 7-day interval watered on 1 October, when I open the list on 8 October, then the plant is marked "Water today".
- Cover the **main case, the edge cases and the errors**: empty data, limits (longest name, maximum number), no permission, no connection, cancelling half way.
- Name **business rules** separately (who may do it, which data, calculations, limits) so they are not lost inside sentences.
- Do not describe the screen ("a green button at the top"): describe the outcome ("I can confirm watering from the plant's detail").
- Non-functional needs (speed, accessibility, privacy) go to a short separate list on the epic, unless they belong to one story.

## Splitting stories that are too big
Split by: steps of the workflow · business rules (one rule per story) · happy path first, errors and variants after · data types or user roles · simple version first, extras later. Never split by technical layers ("backend story", "frontend story").

## Definition of ready
A story goes to UX only when: it has the INVEST form, acceptance criteria with edge cases and errors, business rules, its open questions listed (and answered or explicitly accepted), and a priority from the client (must / should / could).

## Files (the local mirror of the tracker)
`requirements/<area>.md`, one file per epic, so Orbito and the people can read and link it:

```markdown
# EP-01 · Plants get watered on time
Goal: plant owners keep plants watered without remembering it themselves.
Non-functional: works offline for viewing; reminders in the user's time zone.

## REQ-01 · Add a plant with its watering interval
- Status: draft            (draft · ready · approved · changed after mockups · dropped)
- Priority: must
- Flows: P2                (filled by the UX designer in `user-flows`)
- Screens: PL-04           (filled by the UX designer in `wireframes`)

As a plant owner, I want to add a plant with how often it needs water, so that I get reminded on time.

Acceptance criteria
- Given I am on my plant list, when I add "Monstera" with a 7-day interval, then it appears in the list with its next watering date.
- Given the name is empty, when I try to save, then I see what is missing and nothing is saved.

Rules
- Interval: 1–60 days.

Open questions
- Can two plants have the same name? (asked the client 2026-10-23)

History
- 2026-10-23 created (BA)
```

If the team keeps stories in a tracker (Jira and similar), it is the master for developers; `requirements/` mirrors it through a connector. When they differ, never choose silently: show the difference and ask the person which wins.

## Quality bar
- Every story has an id, the INVEST form, testable criteria with at least one edge case or error, and a status.
- No story describes the layout of a screen; no "the user" without a role.
- A tester could write test cases from the criteria alone; a developer could estimate it.
