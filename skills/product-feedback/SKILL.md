---
name: product-feedback
description: Collects anonymous feedback about Orbito itself while people work — moments when the result was not what they wanted, when the tool or a skill failed or misled, when something was missing or worked especially well — into feedback.md in the project, and from time to time invites the person to review it and send it to the Orbito team. Use when the person is unhappy with a result ("that's not it", "no, not like this"), when you did something against their intent, when a tool or check failed, and at the end of a phase or project.
---

# Product feedback

Orbito gets better from what happens in real projects. This skill keeps short, anonymous notes about the tool and its skills — not about the person's product — in `feedback.md` at the project root, so the person can review them and send them to the Orbito team when they want.

## When to write an entry
Write one when it is worth it, not for every small correction:
- the person was clearly unhappy with a result ("that's not it", "no, I wanted…", repeated corrections of the same thing);
- you did something that went against what they asked or meant;
- a tool, command or check failed or gave a wrong answer (`npm run check:ds`, the board, the flows view, `npm create orbito`);
- a skill's guidance was wrong, missing or confusing for this situation;
- something the person needed is missing in Orbito;
- something worked especially well (also useful to know).

## What an entry looks like
```
### <date> · <stage> · <skill or part of the tool>
What happened: <one or two sentences, general terms>
What the person expected: <…>
What helped / how it was solved: <…>
Suggestion: <optional, one line>
```
Stages: kickoff, requirements, architecture, flows, mockups, look & feel, design system, audits, synthetic users, rapid prototype, tool.

## Anonymous by design
Never write names of people, companies, clients or products; no screen content, data, copy, prices, file contents or file paths from the project; no quotes that identify the project. Describe the situation in general terms: "a list screen with filters", "a B2B dashboard", "a mobile app with a tab bar". If an entry cannot be written without identifying details, generalise it or skip it.

## Never change skills from feedback
These notes do not modify skills, agents or the tool. Skills change only when the person explicitly asks for it ("update the UX skill so that…"); then do it, and mention it in an entry.

## Inviting the person to send it
- At the end of a phase that the person approved, at the end of the project, or when about five new entries have collected since the last mention, say once, briefly: "There are a few notes about Orbito itself in `feedback.md` (anonymous). If you want to help improve the tool, have a look, add your own thoughts, and send it to orbito@uncool.pro." Do not repeat it in the same session, never nag, and never send anything yourself.
- If the person adds notes of their own, keep them as they are.

## The file
If `feedback.md` is missing, create it from the header in `references/feedback-template.md`.
