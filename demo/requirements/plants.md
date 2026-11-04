# EP-01 · Plants get watered on time
Goal: plant owners keep their plants watered without remembering it themselves.
Non-functional: the list works offline for viewing; reminders follow the user's time zone.

## REQ-01 · See all my plants in one list
- Status: approved
- Priority: must
- Flows: P1
- Screens: PL-01

As a plant owner, I want to see all my plants in one list, so that I know what I have and where it stands.

Acceptance criteria
- Given I have plants, when I open the app, then I see every plant with its room and when it needs water next.
- Given I have no plants yet, when I open the app, then I see how to add the first one.

## REQ-02 · See which plants need water today
- Status: approved
- Priority: must
- Flows: P1
- Screens: PL-01

As a plant owner, I want the plants that need water today to stand out, so that I water them first.

Acceptance criteria
- Given two plants need water today, when I open the list, then a note says "2 plants need you today" above the list.
- Given no plant needs water, when I open the list, then the note is not shown.

## REQ-03 · Mark a plant as watered
- Status: changed after mockups
- Priority: must
- Flows: P1, P3
- Screens: PL-02, PL-03

As a plant owner, I want to mark a plant as watered from its page, so that the next reminder is set from today.

Acceptance criteria
- Given I am on a plant's page, when I tap "Watered", then I see a confirmation and the next watering date moves.
- Given I am offline, when I tap "Watered", then I am told it will be saved when I am back online.

Rules
- The next date is today plus the plant's interval.

## REQ-04 · Add a plant with its watering interval
- Status: ready
- Priority: must
- Flows: P2
- Screens: PL-04

As a plant owner, I want to add a plant with how often it needs water, so that I get reminded on time.

Acceptance criteria
- Given I fill in the name and the interval, when I save, then the plant appears in my list.
- Given the name is empty, when I try to save, then I see what is missing and nothing is saved.

Rules
- Interval: 1–60 days.

## REQ-05 · Plan the week
- Status: draft
- Priority: should
- Flows: A1
- Screens: SC-01

As a plant owner, I want to see the week's watering at once, so that I can plan around a trip.

Open questions
- Should the week start on Monday everywhere, or follow the phone's settings?
