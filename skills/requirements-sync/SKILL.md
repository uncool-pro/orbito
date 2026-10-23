---
name: requirements-sync
description: Business analyst's sync after approval in Orbito — once the client and the team approve a version of the mockups, the stories, acceptance criteria and test list are updated to describe what was approved (the approved mockups are the source of truth), in requirements/ and in the team's tracker. Use when a flow version or a phase is approved, and when stories and approved screens disagree.
---

# Requirements sync after approval

**Role:** business analyst. **Comes after:** the BA + UX review and the client's approval of a version. **Comes before:** development and testing.

A story is input for UX, not the design. The UX designer may solve it differently — for example add notifications that group others, or group by topic instead of by app section — because the original would be hard to use. That is expected, not a conflict. **Once approved, the mockups are the source of truth** for how the product behaves, and the stories follow them.

## When a version is approved
When `.orbito/process.md` or a flow version records an approval:
1. Compare the approved screens with the stories they reference (and screens without stories).
2. Update the stories so they describe what was approved: changed behaviour, new screens (new stories), removed parts (mark as `dropped`, never delete history). Status: `approved` or `changed after mockups`, with a history line (date, what, who approved).
3. Update acceptance criteria and the list of things to test.
4. Sync the tracker (through its connector, if the team has one) and the local mirror in `requirements/`. If they disagree, do not choose silently: show the difference and ask the person which one wins.
5. Note the sync in `.orbito/process.md` (date, stories touched).

## Checks
- Every approved screen is described by an approved story; no approved story contradicts its screens.
- No story changed after approval without a note who asked for it.
