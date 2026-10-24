---
name: look-and-feel
description: UI designer's look & feel exploration for a new product, a landing page or a redesign in Orbito — five visual directions for the same first flow or page (two safe, one in between, two bold), shown as versions on the board for the client to choose. Use when a new product has its first flows in lo-fi and needs a visual direction, when a landing page has its approved copy, when someone wants an existing site or product redesigned ("modern", "fresh", "from scratch"), or asks for "look and feel", "visual concepts", "styl", "kierunek wizualny", "redesign".
---

# Look & feel

For new products, new pages and **redesigns the person asks for**. An existing product that only needs new screens keeps its look; there the UI designer works from its sources (`design-system`). **For a landing or marketing page, read `references/pages.md` too**: a page is closer to graphic design than to an interface, and the variants are five versions of the whole page with the same approved copy.

The look is chosen once and everything after builds on it, so this competence always runs on the strongest model with high effort (Orbito passes it; see `ui-designer/look-and-feel` in the model profiles). If you notice you were started on anything lighter than Opus with high effort, say so before designing: the results will be weak and generic.

Left alone, a model designs the average of everything it has seen: the same palette, the same type, the same cards. This skill exists to get past that average. It does so with procedures, not with a list of "good" fonts or colours: every published list of replacements becomes the next generic look within months.

## First: how big is the change?
When there is something already (a site, an app, a brand), ask before anything else — the answer decides everything after it:
- **Refresh**: the structure stays, the look gets updated (type, colour, spacing, pictures).
- **Redesign**: a new concept; the brand assets stay (logo, photos, colours if the brand fixes them), the layout and the style are open.
- **From scratch**: a fresh, modern concept; the current site is only a **source of content and assets** (logo, photos, facts, copy that works), never of layout, colours or ornaments.

Then ask what must stay (logo, colours, photos, sections, copy, the order of the offer) and what needs ploughing over completely. Write both lists in your notes. When the person says "full redesign" or "make it modern", the current look is **not a constraint**: do not keep its layout and add an ornament. A redesign is never the old page with a new detail.

## Before designing: ask for guidelines
Ask the person (and through them the client) what already exists: brand book, logo, colours, fonts, examples they like or dislike, screens of products they admire, constraints (accessibility, platform conventions, technology). Build on what exists; do not reinvent a brand. If the brand fixes colours and fonts, keep them in every variant and let the variants differ in composition, density, shape and type scale.

## Set the quality bar: references
Ask the person for 3–5 sites or products they like (and one they dislike). Then, if you can browse, find more yourself: the best current work in the product's industry and in neighbouring ones (award galleries and curated collections of web design are a good start). For each reference write one line on **what** to learn from it (the grid, the type scale, how photos are cropped, one motion idea) — never "make it like this". The references are the bar the variants must meet; the last critique pass checks each variant against them. No browsing available? Say so and rely on the person's examples.

## Use the assets well
Logo, photographs and icons are material, not decoration. Real photos carry a page more than any shape; crop them with intent. Icons work where people scan a list (services, benefits, steps): **an icon with a short text**, one style, one size. Icons on everything, or icons standing in for missing content, are noise. If an asset is weak (a low-resolution logo, dark photos), say so and propose how to work around it instead of hiding it.

## Start from the product, not from a style
Before any variant, write in your notes an **inventory of the product's world**: 8–12 things that belong only to this product and its users — the objects people handle (a plant pot, an invoice, a route), the words of the trade, the people, the places, the moments of use (a glance on the bus, an eight-hour shift). Generic nouns ("users", "data", "items") do not count. Every variant takes its idea from this list.

## Five variants of one flow
Pick one representative flow (usually the happy path of the main task: 3–5 screens; for a page, the whole page) and design it five times:
- **2 safe** — a calm, well-composed design built from what the person brought, close to the lo-fi structure and platform conventions (Material for web/Android, Apple HIG for iOS), different in mood (colour, type, density). Safe means restrained, not unfinished: it still has to look professionally designed.
- **1 in between** — a classic layout with a few deliberate highlights: one distinctive idea (a strong colour field, an unusual type scale, a signature shape) and, on a page, one or two effects that fit it (how the hero appears, a photo treatment).
- **2 bold** — a modern, fresh concept on the level of the best current work in the references: new layouts, expressive type, large imagery, motion, unexpected composition. Still correct (contrast, touch targets, readable copy) and still buildable by developers in the product's technology.

Changing colours and corner radius is not a variant. Each one needs its own idea.

### An idea is structure, not decoration
An idea changes how the whole page or screen is built: the grid, the type, the way pictures are used, the rhythm of sections. A device laid over an otherwise unchanged layout is an ornament, not an idea. **Test: remove the device — does the design change? If not, it was decoration; go back.**
Example (fictional): a building company asks for a full redesign to something modern. A variant called "modern: lamellas" that keeps the old layout and puts four grey lines across the banner fails the test and must never be shown. At full strength the same idea would be: vertical slats as the grid of the whole page, photos cropped into tall strips, section edges in the rhythm of the slats, the slat proportion in the type scale — and the old layout gone.

### The idea sentence and the competitor test
Write each variant's idea as one sentence in the form **"[something from the inventory] becomes [a visual device]"** — "the soil moisture scale becomes the colour system of every screen", "the paper plant label becomes the card shape". Then run the **competitor test**: put the name of the nearest competitor (or another industry) in place of the product. If the sentence and the screens still fit, there is no idea yet; go back to the inventory. Safe variants may have a quieter idea, but they still need one.

### Bold variants are dealt, not imagined
What a model "comes up with" is its average again. So the two bold variants start from a **random draw** of directions from `references/directions.md`:
1. Draw three directions at random with a real random source, not by picking (for example `node -e "const n=14;console.log([...Array(n).keys()].sort(()=>Math.random()-.5).slice(0,3).map(i=>i+1).join(', '))"`, with `n` set to the number of directions in the file), and write the drawn numbers in your notes.
2. From these three, choose the two that suit the product (its users, moments of use, platform) and write one line on why.
3. Commit to the direction. Do not redraw it into something more comfortable; redraw only for a reason you can state (it breaks the brand, the platform or accessibility) and write that reason down.
Each bold variant still gets its own idea sentence from the inventory: the direction is the device, the product is the content.

### Avoid the generated look
`references/tells.md` lists devices that make a screen read as generated today (with the date of the last review). Use it while proposing: none of the five variants should lean on them by default. It is knowledge for this skill, not a rule for audits: if the client later chooses one of these devices on purpose, that is their decision. Removing tells is not enough either: a variant with nothing generic left and nothing put in its place is an empty variant. Fill the space with the idea.

## Look at the screens before showing them
Judge the variants on screenshots, never on the code: you wrote the code, so you read your intentions into it. Open each variant on the board or the single-screen view (or take headless screenshots) at its real viewport, and for each one answer in writing:
1. **One second.** Glance and look away: what did you see? There should be one answer (a word, a figure, an object). "An app" means there is no focal point.
2. **Squint.** Text becomes grey bars: do two or three masses lead, or is everything medium?
3. **Cover the logo.** Could this be the competitor's product? (the competitor test, now on pixels)
4. **Edges and space.** How many different left edges? Are related things close and unrelated ones far? Any accidental hole?
5. **Colour.** Which colour holds most of the surface, which supports, where is the accent? An accent in ten places means nothing.
6. **Sameness.** Put the five side by side: do any two read as the same design in different colours? Then one of them is not a variant.
7. **Correctness.** Contrast, touch targets, readable copy on the smallest viewport.
8. **The bar.** Put each variant next to the references. Would a good studio show it in its portfolio? Would the person recognise what they asked for (a full redesign looks new at first glance)? If not, it is not ready, whatever the other passes say.

Fix in this order, because later steps cannot rescue earlier ones: the idea → hierarchy → composition → type → colour → detail → motion. When removing something leaves a gap, close the gap or enlarge what remains; do not refill it with an ornament. At most three rounds; if a variant is still weak after that, say so plainly when presenting it.

## In Orbito
- Each variant is a **version** of the chosen flow (`versions` in its flow file, `state: 'open'`, a name with its idea), built with its own tokens and components (a `design-system/variants/<name>/` folder or token overrides), so the board shows all five under the original.
- Present them together — for a page always at **desktop, tablet and phone side by side** (one responsive implementation, see `references/pages.md`), never at a single in-between size: "I prepared five directions — which one speaks to you?" For each, give its idea sentence (and, for the bold ones, the drawn direction). Collect what people like and dislike in each, not only the winner; mixing is allowed.
- Iterate while the person is still choosing: a round of feedback **changes the variants in place**; a mix of two becomes one of the five, replacing one. Never more than five variants open at once — new versions piling up on the board make it unreadable.

## Close the exploration as soon as one direction wins
Look & feel is a choice, not the place where the chosen design gets polished. The moment one direction clearly wins — the person says "this one", or starts asking for changes to only one variant ("more air here", "a different photo in this one") — **stop and propose closing the exploration** before making those changes:
> "It looks like you have chosen **[variant and its idea]**. Shall I close the look & feel? I will keep this direction, remove the other variants from the board and the project (their versions and `design-system/variants/` folders), and from now on we refine only this one, as the project's design."

- **Only with the person's consent.** If they want to keep another variant to borrow from, keep that one too and say it stays until the design system is built. If they are not sure yet, keep exploring — but do not deepen one variant while the others are still open.
- **Then clean up:** in the flow file, the chosen version becomes `merged` and the others are deleted with their screens; their `design-system/variants/<name>/` folders go; the board shows only the chosen direction. Run `npm run check:ds` and `npm run typecheck`, and look at the board.
- **Record it** in `.orbito/process.md`: who chose, when, which variant and its idea sentence, what was mixed in from others, what was removed.
- **Hand over:** the refining continues as the project's design — `design-system` turns the direction into tokens and components, and `ui-design` builds and refines the screens in it. From then on every change ("more air", "a bigger headline") is made in the design system and the real screens, not in a variant, and new screens are built hi-fi.
