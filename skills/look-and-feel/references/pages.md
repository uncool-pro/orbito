# Look & feel for pages (landing and marketing pages)

A page is read, not worked in. It is closer to graphic design than to an interface: it may be more expressive than the product's screens, but it stays inside the brand (logo, colours, type, voice, pictures) and it stays readable. Everything in `SKILL.md` applies; this file adds what differs for pages.

## Before the variants
- **The copy is approved first** (`page-copy`, from the analyst's `value-proposition`), and all five variants use the same copy. The client then compares the look, not the words.
- **The funnel decides the order** of sections (`content/funnel.md`). A variant may change how a section looks, never which question it answers or where it sits.
- **Brand assets in hand**: logo files, font files with a web licence, photographs. A page without real pictures looks unfinished next to one with them; if there are none yet, say so and agree with the person what stands in (product screenshots, the author's photo, typography doing the work) instead of drawing grey boxes.

## What makes a page hold together
- **The first screenful is one thing.** A glance should leave one word, one picture or one object in memory. The headline, one supporting sentence, the main button and one strong visual; nothing competing with them.
- **Headlines fit in two lines** on a phone and on a desktop. A longer thought is the sentence under the headline.
- **One dominant element per section.** Make the big thing bigger and the small things fewer before adding anything.
- **Vary the composition between sections.** Name each section's layout in one word (split, list, full-bleed, grid, statement, quote…). The same word twice in a row is the template showing.
- **Few, shared edges.** Text blocks start on two or three vertical lines used again and again, not on a new one for every block. Page margins are equal on both sides.
- **Space is decided.** The gap between sections is clearly larger than any gap inside one. An empty area is either a deliberate rest or a hole; holes appear beside short columns and under removed decorations.
- **Readable text.** Running text at least 16px on pages, lines of about 45–75 characters, body text in the main ink colour (not light grey), no centred paragraphs longer than three lines.
- **Accent discipline.** The accent marks the main action and one or two details. An accent everywhere marks nothing.
- **Full, not thin.** Each screenful of the page should feel composed. A narrow column of small text with empty ground on both sides reads as unfinished, however tasteful.
- **Motion is optional and single.** At most one signature movement (how the hero appears, how a section enters) that fits the idea; never the same fade on every block. The static export has no scripts: motion is CSS only and the page must be complete without it.

## One page, three sizes, side by side
A page is **one responsive implementation**, never separate desktop and phone screens. Each variant is one screen file with `viewports: ['desktop', 'tablet-web', 'mobile-web']` in its `meta`: the board shows it at desktop size, and the prototype view shows all three sizes **next to each other**, so the person sees at once whether it is what they meant. Always present and screenshot all three; never ask for an opinion on a single, in-between size.
- Build it so it adapts by itself: `Grid` (columns that fit the width), and where a layout or a size must change, CSS container queries on the page (`@container page (max-width: 600px) { … }`) or container units (`cqi`) inside the design system's components — not separate screens, not JavaScript.
- The phone is still its own composition: more than half of visitors may arrive on one. Check its line breaks in headlines, its crop of pictures, the main button in the first screenful, nothing running off the edge. The tablet is neither a stretched phone nor a squeezed desktop: check that it holds its own.

## Extra passes for the critique
Add these to the passes in `SKILL.md` when the variant is a page:
1. **Five seconds as a stranger**: what is this, who is it for, what do I do next? If the title only makes sense after scrolling, it is not a title.
2. **The idea reaches the end**: does the variant's idea carry through to the offer, the FAQ and the footer, or does the page turn into stock blocks after the hero?
3. **Pictures**: does every picture do a job (show the thing, set the scene, prove a claim)? Do they share one light and one crop logic?
4. **Collisions**: is anything lying over a headline or a button at any width?
