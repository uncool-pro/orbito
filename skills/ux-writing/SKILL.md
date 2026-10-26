---
name: ux-writing
description: UX designer's interface copy in Orbito — labels, buttons, headings, hints, errors, empty and success states written in the product's language and the users' words, consistent across screens. Use while building wireframes, when screens still have placeholder text, when synthetic users report words they do not understand, and before showing screens to a client.
---

# UX writing

**Role:** UX designer. **Works inside:** wireframes and UI design. **Checked by:** synthetic users (words people do not understand) and the UX audit (`ux-audit`, by the design auditor).

Interface words are part of the design: a screen with the right layout and the wrong words still fails. Write them while building, never leave lorem ipsum or "Button" for later.

## Rules
- **The users' words, not the system's.** "Orders" not "Transactions" if users say orders; take terms from the stories, research and the client's customers, not from the database.
- **Buttons say what happens**, starting with a verb: "Save changes", "Send invoice", "Water now". Never "OK", "Submit" or "Click here" when the action can be named.
- **One term per thing.** Keep a short glossary in `requirements/glossary.md` (term, meaning, words to avoid) and use it on every screen.
- **Errors say what happened and what to do next**, without blame and without codes: "We couldn't save the plant — no connection. Try again when you're online."
- **Empty states say why it is empty and what to do**: "No plants yet. Add your first one to get watering reminders."
- **Confirmations of destructive actions name the consequence**: "Delete 'Monstera'? Its watering history will be lost."
- **Short, scannable**: the important word first; sentence case; numbers as digits; no jargon the audience would not use.
- **The product's language** (`orbito.config.ts` locale and the kickoff): correct grammar, typography and plural forms of that language.

## Check
Read each flow aloud from the first to the last screen: does the person always know where they are, what happened and what to do next? Then check the glossary terms are used the same way everywhere.
