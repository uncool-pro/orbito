---
name: process-landing-page
description: Orbito's process for a landing page or a marketing page — a static page that is both the mockup and the product. Funnel of sections → sales copy → lo-fi page → look & feel → hi-fi page → check with the target group → static export ready for any host. Use when the project type is a landing page, or someone asks for a landing, a sales page, a product page, a "strona sprzedażowa" or "landing".
---

# Process: landing page

Run by **Orbito** (the lead).

A landing page is product design with a different centre of gravity: little interface, a lot of argument. Its job is one conversion (buy, sign up, book a call, download), and its flow runs between **sections** of one page, not between screens. Because the page is static, the approved mockup is exported as the real site: no handover, no rebuild.

## Steps
| # | Step | Role | Skill | Output | Gate |
|---|---|---|---|---|---|
| 1 | Brief | orbito | project-kickoff | goal, audience, offer, brand sources in `.orbito/process.md` | person confirms the brief and the depth |
| 2 | Value proposition | business-analyst | value-proposition | `content/research.md`, `content/value-proposition.md`, `.orbito/personas.md` | **person approves the value proposition** |
| 3 | Funnel of sections | ux-designer | user-flows | `content/funnel.md` | **person approves the funnel** |
| 4 | Page copy | ux-designer | page-copy | `content/copy.md`, section by section | **person approves the copy** |
| 5 | Lo-fi page | ux-designer | wireframes | the page on the base kit with the real copy, one responsive screen (desktop, tablet, phone side by side) | UX audit |
| 6 | Visual direction | ui-designer | look-and-feel | five (light: three) variants of the page; after the choice only the chosen one stays | **person picks a direction**, agrees to remove the others |
| 7 | Design system | ui-designer | design-system | tokens, fonts, section components | `check:ds` clean |
| 8 | Hi-fi page | ui-designer | ui-design | the chosen direction on every section | — |
| 9 | Accessibility | design-auditor | accessibility-audit | findings | high findings fixed |
| 10 | Five-second test | synthetic-user | synthetic-usability | signals on the first screenful and the whole page | findings decided (`design-decisions`) |
| 11 | Publish | orbito | process-landing-page | `npm run export` → `site/` | **person publishes** |

The person approves the funnel, the copy, the chosen direction and the final page. Every approval goes to `.orbito/process.md`. Conversion data after launch is not part of Orbito yet; say so when the person asks how to measure the page.

## Redesigning an existing page
When a page already exists, do not start from an empty brief. Follow `orbito` → "Start from what exists": audit the current page first (its funnel, its copy against the `page-copy` checklists, its look, accessibility, how it reads on a phone), extract the brief, the audience and the offer from it, and propose per section what to keep, fix or redesign. Rebuild the kept parts in Orbito as they are (they become the lo-fi starting point), and run the process steps only for the rest. The person confirms the list first.

## Scale the process to the page
Seven roles are worth it for a large page with a lot at stake; for a small one they cost more than they give. At the brief, the lead proposes a depth and the person decides:
- **Light** (one offer, a short page, the person knows their audience well): the lead does the value proposition and the UX designer writes the funnel and the copy and builds the page in one go, the ui-designer does look & feel with **three** variants instead of five, one synthetic check at the end. No separate reviews between steps.
- **Full** (a new product, an unknown audience, paid traffic, several offers): every step as in the table, each with its own role and review.

Start light when unsure and add a step only where the result was weak (for example, copy that does not convince → a full `value-proposition` round with research). Record the chosen depth in `.orbito/process.md`, and add a `product-feedback` note on whether it was right: too heavy, too light, or fine. That is how this process learns its default.

## Brief (step 1): what the kickoff must collect
- **The one conversion**: what the visitor should do, and where that action leads (a checkout link, a form service, a calendar). One page, one goal; secondary actions only if they lead to the same goal.
- **Who arrives and from where**: the audience, and the traffic source (an ad, a post, a search, a recommendation). The source tells how much the visitor already knows (see awareness in `value-proposition`).
- **The offer**: what exactly the person gets, the price, the terms, what makes it different from the alternatives.
- **Proof that exists**: real opinions (with consent), numbers, examples of results, the author's story. Never invent proof.
- **Brand**: logo, colours, fonts (files and licences), photographs, tone of voice, an existing site.
- **Where it will be hosted**: any static host works; ask only so the person knows `site/` is what goes there.

## Funnel of sections (step 3, UX)
The funnel is the information architecture of a landing: the order of sections, each answering the next question the visitor has. Write `content/funnel.md`:

```
Goal: <the one conversion>
Visitor: <who, from where, what they already know>
| # | Section (id) | Visitor's question | What answers it | Action |
| 1 | hero         | What is it, is it for me? | headline + one sentence + picture | primary button → #offer |
| … |
Navigation: <which sections the menu links to, or none>
Exits: <every link that leaves the page and why>
```

Rules:
- The order follows the visitor's questions, not a template. A visitor who already knows the product needs the offer early; one who does not yet see the problem needs it named first (`value-proposition` → awareness).
- Every section earns its place with a question. No question, no section.
- The primary action appears in the first screenful and again after the sections that remove the main doubts (proof, offer, FAQ). Every button names what happens.
- Navigation is optional: a long page with a menu helps returning visitors; a short sales page often works better without one. Decide with the person.
- Plan the phone first: on a phone the funnel is a single column read top to bottom.

## Building the page (steps 5–8)
- **One page = one responsive screen.** `screens/landing/landing.screen.tsx`, wrapped in `PageScreen`, with `viewports: ['desktop', 'tablet-web', 'mobile-web']` in its `meta`: the board shows the desktop size, the prototype view shows all three side by side. One implementation that adapts (`Grid`, container queries `@container page (…)`), never separate phone screens. The page is seen through a browser window: a header or navigation that stays at the top goes into `top`, a cookie bar or sticky call to action into `bottom`, never into the scrolling content (see `wireframes`). Put it in a flow (`flows/landing.flow.ts`) so the board shows it; variants of look & feel are `versions` of that flow.
- **Sections** are design-system components built on `Section` (each with an `id` from the funnel). A section type that repeats with different content (a feature row, a testimonial) is its own organism with docs.
- **Links** use `href`: `href="#offer"` for a section of the page, a full address for anything that leaves it. `to` (other screens) has no meaning on a static page and is dropped in the export.
- **Layout without media queries**: `Grid` and wrapping flex layouts adapt to the width, so the same markup works on the board, in the prototype and in the export. Check the mobile screen on the board after every change.
- **No scripts on the page.** Disclosures are `Disclosure` (`<details>`); forms post to an external service or are a link to one. If the person needs something interactive (a calculator, a carousel), say it needs a script after the export and record it as an open question.
- **Copy lives in `content/copy.md`** and is pasted into the sections word for word. A change of copy goes to `copy.md` first, then to the page.
- **Fonts** go into `design-system/fonts.css` (`@font-face` with `url('./fonts/…')`, or an `@import` of a font service) and their files into `public/fonts/`. Check the licence allows web use. Pictures go into `public/` and are referenced as `./images/…`.
- **The lo-fi page** uses the base kit and the real copy, never lorem ipsum: on a landing the words are the design.

## Checking the page (steps 9–10)
- **Five-second test** (synthetic users, each persona separately): after a glance at the first screenful, what is this, who is it for, what would you do next? Then the whole page: where did you stop reading, what is unclear, what would stop you from buying, what word did you not understand.
- **Copy review** by the UX designer against the `page-copy` checklists after the persona signals.
- **Accessibility**: contrast, headings in order (one h1, then h2 per section), link texts that make sense alone, alt texts for pictures, readable on a phone.
- The person decides on each finding; record it in the review file.

## Publish (step 11)
1. In `orbito.config.ts` set `site: { screen: 'landing', title, description, lang }`. The description is what search engines and link previews show: one or two sentences from the copy.
2. `npm run check:ds` (0 errors), `npm run typecheck`, then `npm run export` → `site/index.html` with everything in `public/`.
3. Open `site/index.html` in a browser at desktop and phone width; check every link (each `#id` exists, every external address is right).
4. The person uploads `site/` to their host or commits it to the repository the host deploys from. Never publish, push or deploy on your own.
