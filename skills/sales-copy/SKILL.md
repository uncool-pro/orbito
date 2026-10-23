---
name: sales-copy
description: Writing and reviewing the sales copy of a landing page or a product page in Orbito — research in the customers' own words, the value proposition, copy fitted to how much the visitor already knows, section by section from hero to final call to action, honest proof and answered objections, checked against lists before and after the page is built. Use for "copy", "tekst sprzedażowy", "headline", "value proposition", "CTA", "FAQ", and in step 3 of the landing-page process.
---

# Sales copy

On a landing page the words are the design: layout can make good copy easier to read, but it cannot rescue copy that does not say why this offer is the right one for this visitor. Write the copy before the visual design, in the product's language and in the brand's tone of voice.

## Before writing: research
1. **The customers' own words.** Collect how the audience describes the problem, the result they want and their doubts: reviews (of this product and of the alternatives), comments, questions people ask, sales and support conversations, interviews. Ask the person for these sources; search public ones when allowed. Keep the phrases that repeat: they go into headlines almost word for word. Save them in `content/research.md` with their source.
2. **The offer in facts.** What exactly the buyer gets, the price and terms, how it is delivered, what it does not include.
3. **An inventory of values, not one slogan.** With the person (and anyone who knows the customers), list everything the offer gives — aim for twenty or more items, in three areas: the product or service itself; the way it is delivered and supported (speed, simplicity, someone to ask); what comes on top without paying for it. Owners usually take their strongest advantages for granted ("everyone does that"); ask until those come out. Useful questions: what do we do faster, more precisely or more simply than others? What do customers praise us for? What risk do we take off them? Which common mistake do we help them avoid? What did we invest in (people, process, tools) and how does it make the customer safer? Keep the list in `content/research.md`; the page tells a chosen few of its items.
4. **"So what?" for every item.** Push each value to its consequence for the customer until it is something they would care about: not "a big stock" but "order the day before you need it and keep your cash". A value that never reaches a consequence stays off the page.
5. **Match values to problems.** Pair the values with the audience's real problems (from step 1). This shows the gaps (a problem you have nothing for) and the values that solve problems nobody has. When several people decide together (a business buyer: the user, the manager, finance), list the problems and the doubts of each role separately.
6. **Check the hypotheses.** Ideally the person talks to about ten people from the audience and tests the main problems and values on them. If that is not possible, say plainly that the copy rests on untested assumptions.
7. **The difference.** Why this and not an alternative (including doing nothing, doing it yourself, or staying with the current supplier). A difference every competitor could also claim ("quality", "experience", "flexibility", "leader") is not a difference: it cannot be disproved and nobody remembers it. A difference does not have to be unique either; anything that measurably saves the customer time, money or risk counts: a faster quote, a clearer offer, a lower entry step, predictable prices, a narrow specialisation with examples, a known face behind the brand, doing a piece of the customer's work for them.
8. **Proof that exists.** Real opinions (with the author's consent), numbers with their source, examples of results, the author's story, a demo. If there is no proof, the page shows the product itself instead; it never invents it.
9. **Tone of voice.** Ask for the brand's voice (examples of texts the person likes and dislikes). Without one, write plainly: short sentences, concrete words, no hype.

## How much the visitor knows (awareness)
Decide it from the traffic source (`process-landing-page` brief), because it sets where the page starts:
| The visitor… | Start with | The page is |
|---|---|---|
| does not see the problem yet | a situation they recognise | long: situation → problem → solution → proof → offer |
| feels the problem, does not know solutions | the problem in their words | long: problem → how it is solved → proof → offer |
| knows solutions, not this one | the result and the difference | medium: result → how it works → proof → comparison → offer |
| knows this product, hesitates | the offer and what removes the doubt | short: offer → proof → objections → action |
| is ready | the offer and the action | very short |
A page usually serves one level well; if traffic is mixed, write for the earliest level in the hero and let the navigation take the ready ones to the offer.

## The value proposition
Chosen from the inventory: the value that answers the audience's biggest problem best. One or two sentences that say **for whom**, **what result** and **why this way**. It becomes the hero headline and the line under it. Test: would the reader understand it in five seconds, without knowing the brand? Would it still be true with a competitor's name in it? (Then it is not specific enough.)

## Section by section
Write `content/copy.md` in the order of `content/funnel.md`, one block per section: its id, headline, text, button label and target. For each:
- **Headline**: what the section gives the reader, not its category ("Your plan is ready every Sunday", not "Features"). Specific, plain, at most two lines on a phone.
- **Text**: the conclusion first, then the support. One idea per paragraph, short paragraphs, lists where things are parallel. People scan first and read only what earns it.
- **Each argument: problem → how it is solved → the effect.** Start from the reader's problem in their words (it makes them listen), then how the offer solves it — not what the offer contains — then what changes for them: time, money, risk, numbers, how it feels. A feature put before the problem sounds like boasting. For a reader who already knows the problem well, a short context (something observed in their field) can replace it.
- **Show the mechanism.** After every claim the reader silently asks "how, exactly?". Answer it: what you do differently that makes it true (a method, a process, a tool, how the work is organised). A claim without its mechanism is not believed.
- **Benefits come with their features**: each feature is followed by what it changes for the reader ("…so you…"). Keep the feature too: it is the proof that the benefit is real.
- **Specifics over adjectives**: numbers, names of situations, what exactly happens. Remove every adjective that the reader would expect any seller to use.
- **Objections where they arise**: the doubt that appears after the price is answered next to the price; the rest go to the FAQ, written as the visitor would ask.
- **Risk reversal**: what makes saying yes safe (a guarantee, a free start, cancel any time, what happens with their data) — only what is true.
- **Make the first step small and easy**: the lowest-commitment way to start (a trial, a short first session, a sample), what happens after the click, and the key terms in one place. Offer one recommended option, or at most three; more options stop people from choosing.
- **Price**: show it, or at least its range, rather than hiding it; tie it to the cost or risk it removes for the reader. A discount is never the first argument.
- **Buttons** name what happens ("Get the course", "Book a 20-minute call"), never "Submit" or "Learn more". A short line next to the main button removes the last doubt ("Access for life, invoice included").
- **Proof** next to the claim it supports, with a name and a role when the author agreed to it.

## Checklists
Before handing the copy over, and again on the built page:
- **Hero**: in five seconds it is clear what this is, for whom, and what to do; no jargon the audience would not use; one main action.
- **Each section**: answers its question from the funnel; the headline works alone (people read only the headlines); every claim is specific or proven; the reader's words, not the company's internal vocabulary.
- **Proof**: real and verifiable, nothing invented, nothing exaggerated.
- **Objections**: the real doubts are listed and each has an answer on the page.
- **Form**: descriptive headings, one idea per paragraph, the conclusion first, as short as it can be while complete; one call to action repeated, not five different ones.
- **About the reader, not the seller**: no section that is only about the company (years on the market, awards, its history) unless it answers a doubt of the reader; every argument starts from the reader's problem.
- **One message everywhere**: the page says what the person's sales conversations, offers and posts say; contradictions cost trust.
- **Voice**: sounds like the brand; reads aloud without stumbling; no hype words that a reader skips ("revolutionary", "seamless", "unlock"); no "not just X, it's Y".
- **Language**: correct spelling, grammar and typography of the page's language (quotes, dashes, non-breaking spaces where the language needs them).

## With the target group
After the page is built, the synthetic users (`synthetic-usability`) do the five-second test and read the whole page. Their signals come back to you: fix the copy, defend it with a reason, or ask the person. Personas are signals, not proof: real readers from the audience are better whenever the person can ask a few of them.

## Output
`content/research.md` (phrases with sources), `content/copy.md` (section by section, with button labels and targets), and a short note for the person: the value proposition, the awareness level you wrote for and why, the proof used, and every open question (missing proof, an unclear price, a claim you could not verify).
