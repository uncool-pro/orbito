---
name: look-and-feel
description: UI designer's look & feel exploration for a new product or a landing page in Orbito — five visual directions for the same first flow or page (two safe, one in between, two bold), shown as versions on the board for the client to choose. Use when a new product has its first flows in lo-fi and needs a visual direction, when a landing page has its approved copy, or when someone asks for "look and feel", "visual concepts", "styl", "kierunek wizualny".
---

# Look & feel

Only for new products and new pages. An existing product already has its look; there the UI designer works from its sources (`design-system`). **For a landing or marketing page, read `references/pages.md` too**: a page is closer to graphic design than to an interface, and the variants are five versions of the whole page with the same approved copy.

Left alone, a model designs the average of everything it has seen: the same palette, the same type, the same cards. This skill exists to get past that average. It does so with procedures, not with a list of "good" fonts or colours: every published list of replacements becomes the next generic look within months.

## Before designing: ask for guidelines
Ask the person (and through them the client) what already exists: brand book, logo, colours, fonts, examples they like or dislike, screens of products they admire, constraints (accessibility, platform conventions, technology). Build on what exists; do not reinvent a brand. If the brand fixes colours and fonts, keep them in every variant and let the variants differ in composition, density, shape and type scale.

## Start from the product, not from a style
Before any variant, write in your notes an **inventory of the product's world**: 8–12 things that belong only to this product and its users — the objects people handle (a plant pot, an invoice, a route), the words of the trade, the people, the places, the moments of use (a glance on the bus, an eight-hour shift). Generic nouns ("users", "data", "items") do not count. Every variant takes its idea from this list.

## Five variants of one flow
Pick one representative flow (usually the happy path of the main task: 3–5 screens) and design it five times:
- **2 safe** — close to the lo-fi structure and platform conventions (Material for web/Android, Apple HIG for iOS), different in mood (colour, type, density).
- **1 in between** — recognisable conventions with one distinctive idea (a strong colour field, an unusual type scale, a signature shape).
- **2 bold** — bend the design system: new layouts, expressive type, motion, unexpected composition. Still correct (contrast, touch targets, readable copy) and still buildable by developers in the product's technology.

Changing colours and corner radius is not a variant. Each one needs its own idea.

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

Fix in this order, because later steps cannot rescue earlier ones: the idea → hierarchy → composition → type → colour → detail → motion. When removing something leaves a gap, close the gap or enlarge what remains; do not refill it with an ornament. At most three rounds; if a variant is still weak after that, say so plainly when presenting it.

## In Orbito
- Each variant is a **version** of the chosen flow (`versions` in its flow file, `state: 'open'`, a name with its idea), built with its own tokens and components (a `design-system/variants/<name>/` folder or token overrides), so the board shows all five under the original.
- Present them together: "I prepared five directions — which one speaks to you?" For each, give its idea sentence (and, for the bold ones, the drawn direction). Collect what people like and dislike in each, not only the winner; mixing is allowed.
- Iterate on the chosen direction with the client until approved ("this is boring", "more air", "less playful").

## After approval
Record the approval (who, when, which variant and what was mixed in) in `.orbito/process.md`, mark the version `merged`, drop the others, and continue with `design-system` to turn the direction into all the building blocks. From then on new screens are built hi-fi.
