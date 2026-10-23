---
name: requirements-sync
description: Business analyst's maintenance of the stories in Orbito — keeping the business requirements consistent with the approved mockups and with the team's tracker. When the person approves a flow or screens (lo-fi or hi-fi) that work differently from the stories, the analyst points out the changes, asks whether to update the stories, and updates stories, acceptance criteria and tests in requirements/ and, through a connector, in the tracker (Jira or similar). Use after any approval of flows or screens, when stories and screens disagree, and when the team wants its tracker connected.
---

# Requirements sync and consistency

**Role:** business analyst. **Triggered by:** an approval of a flow or screens, at any fidelity. **Comes before:** development and testing.

A story is input for UX, not the design. The UX designer may change a flow because the original would work badly on screen — that is expected. Once the person approves the changed flow or screens, **the approved mockups are the source of truth**, and keeping the stories consistent with them is the analyst's job: an audit of the business requirements' consistency, as part of maintaining the stories.

## When something is approved
Orbito calls the analyst whenever `.orbito/process.md` or a flow version records an approval (lo-fi or hi-fi, a flow or single screens):
1. **Compare** the approved screens and flows with the stories linked to them (`requirements` on the flow, `meta.requirements` on the screens) and with the screens that have no story.
2. **Show the person the differences** in plain words — "on the approved screens notifications are grouped by what they ask of you; REQ-07 still says by app section" — and **ask whether to update the stories**.
3. On a yes: update the stories so they describe what was approved — changed behaviour, new screens (new stories), removed parts (`dropped`, never delete history). Status `approved` or `changed after mockups`, with a history line (date, what changed, who approved).
4. Update the acceptance criteria and the list of things to test.
5. Sync the tracker, if connected (below), and the local mirror in `requirements/`.
6. Note the sync in `.orbito/process.md` (date, stories touched).

## The team's tracker (Jira or similar)
Developers and testers usually work from a tracker, so the stories should live there too.
- At the kickoff, or the first time stories are written, **ask whether the team uses a tracker** and recommend connecting it (an MCP connector for Jira or the team's system), so the stories are kept in both places.
- When connected, the tracker is where developers read the stories; `requirements/` is the local mirror Orbito links screens to. Every change goes to both, in the same step.
- When they disagree (someone edited the tracker directly), never choose silently: show the difference and ask the person which one wins, then update the other.
- Without a connector, `requirements/` is the only source; say so once, and offer an export the team can paste into its tracker.

## Consistency audit (any time)
Also on request, or before a client review: every approved screen is described by an approved story; no approved story contradicts its screens; every story in scope has a flow (from `requirements/coverage.md`); no story changed after approval without a note who asked for it. Report the gaps as a short list for the person.
