---
name: requirements
description: Business-analyst work in Orbito — writing functional requirements as user stories with acceptance criteria, keeping requirements/*.md as the local mirror of the team's tracker, linking stories to screens, and syncing stories after a mockup version is approved. Use when stories are missing or unclear, when a version is approved, when someone asks what to test, or when requirements and mockups disagree.
---

# Requirements (business analyst)

## The role
The business analyst gathers functional requirements from the client (workshop, interviews with stakeholders) and writes them down. The analyst understands the technology, so the requirements are realistic — but does not validate them with users and does not redesign them. Challenging requirements from the user's point of view is the UX designer's job.

## A good story
- Describes **functionally what happens and what we want to achieve**: who, what they do, why it matters.
- Has acceptance criteria that a tester can check (given / when / then, or a short checklist).
- Names business rules and limits (who may do it, what data, what if it fails).
- Has an id (`REQ-12`) that screens reference in `meta.requirements`.

Example (fictional):
> **REQ-07 · Group notifications by what they are about.** As a store manager I want notifications grouped by topic so I can deal with one topic at a time.
> Acceptance: notifications of the same topic appear under one heading with a count; opening the group shows the items newest first; a group with unread items is marked.

## Story is input, not the design
The UX designer may solve a story differently — for example add grouping notifications that the story did not mention, or group by topic instead of by app section, because the original would be hard to use. That is expected, not a conflict. The **approved mockups are the source of truth** for how the product behaves.

## After a version is approved (the sync rule)
When `.orbito/process.md` or a flow version records an approval:
1. Compare the approved screens with the stories they reference (and the screens without stories).
2. Update the stories so they describe what was approved: changed behaviour, new screens (new stories), removed parts (mark as dropped, do not delete history).
3. Update acceptance criteria and the list of things to test.
4. Sync the tracker (through its connector, if the team has one) and the local mirror in `requirements/`. If they disagree, do not choose silently: show the difference and ask the person which one wins.
5. Note the sync in `.orbito/process.md` (date, stories touched).

## Files
`requirements/<area>.md` — one section per story: id, title, story, acceptance criteria, rules, screens (codes), status (`draft`, `approved`, `changed after mockups`, `dropped`), history of changes.

## Checks
- Every screen with a code references at least one story; every story is covered by at least one screen or explicitly marked as not designed yet.
- No story changes after approval without a note who asked for it.
