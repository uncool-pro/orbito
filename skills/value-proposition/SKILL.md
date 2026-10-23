---
name: value-proposition
description: Business analyst's analysis of the business behind a product or page in Orbito — the audience and its own words, problems, an inventory of values pushed to their consequence, the difference against alternatives and competitors, real proof, objections, how much the visitor already knows, the value proposition and personas of the target group. Produces the artifacts UX writes page copy from and synthetic users are built from. Use before page copy is written, before a landing page or product page, when the offer or audience is unclear, or when someone asks for a value proposition, personas or competition.
---

# Value proposition

**Role:** business analyst. **Comes before:** page copy (UX designer, `page-copy`) and synthetic users (personas). **Output:** `content/research.md` (the audience's words with sources, the inventory of values, the difference, proof, objections), `content/value-proposition.md` (the proposition, the awareness level and why), `.orbito/personas.md` (the target group).

The business thinking comes first: what the offer really gives, to whom, against which alternatives, and how the audience talks about it. The UX designer writes the words of the page from these artifacts; nobody writes copy from adjectives.

## Research
1. **The customers' own words.** Collect how the audience describes the problem, the result they want and their doubts: reviews (of this product and of the alternatives), comments, questions people ask, sales and support conversations, interviews. Ask the person for these sources; search public ones when allowed. Keep the phrases that repeat: they go into headlines almost word for word. Save them in `content/research.md` with their source.
2. **The offer in facts.** What exactly the buyer gets, the price and terms, how it is delivered, what it does not include.
3. **An inventory of values, not one slogan.** With the person (and anyone who knows the customers), list everything the offer gives — aim for twenty or more items, in three areas: the product or service itself; the way it is delivered and supported (speed, simplicity, someone to ask); what comes on top without paying for it. Owners usually take their strongest advantages for granted ("everyone does that"); ask until those come out. Useful questions: what do we do faster, more precisely or more simply than others? What do customers praise us for? What risk do we take off them? Which common mistake do we help them avoid? What did we invest in (people, process, tools) and how does it make the customer safer? Keep the list in `content/research.md`; the page tells a chosen few of its items.
4. **"So what?" for every item.** Push each value to its consequence for the customer until it is something they would care about: not "a big stock" but "order the day before you need it and keep your cash". A value that never reaches a consequence stays off the page.
5. **Match values to problems.** Pair the values with the audience's real problems (from step 1). This shows the gaps (a problem you have nothing for) and the values that solve problems nobody has. When several people decide together (a business buyer: the user, the manager, finance), list the problems and the doubts of each role separately.
6. **Check the hypotheses.** Ideally the person talks to about ten people from the audience and tests the main problems and values on them. If that is not possible, say plainly that the copy rests on untested assumptions.
7. **The difference.** Why this and not an alternative (including doing nothing, doing it yourself, or staying with the current supplier). A difference every competitor could also claim ("quality", "experience", "flexibility", "leader") is not a difference: it cannot be disproved and nobody remembers it. A difference does not have to be unique either; anything that measurably saves the customer time, money or risk counts: a faster quote, a clearer offer, a lower entry step, predictable prices, a narrow specialisation with examples, a known face behind the brand, doing a piece of the customer's work for them.
8. **Proof that exists.** Real opinions (with the author's consent), numbers with their source, examples of results, the author's story, a demo. If there is no proof, the page shows the product itself instead; it never invents it.
9. **Tone of voice.** Ask for the brand's voice (examples of texts the person likes and dislikes). Without one, write plainly: short sentences, concrete words, no hype.

## Personas of the target group
From the research, describe 5–8 people from the target group who differ in what matters for this product (experience with similar products, how often they would use it, what they want to achieve, what they are afraid of, where they meet the product). Save them in `.orbito/personas.md`; the synthetic users and the UX designer use them, and they are refined when the team learns about real users.

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

## Hand-over
To the UX designer for `page-copy`: `content/research.md`, `content/value-proposition.md` and the open questions (missing proof, an unclear price, a claim you could not verify). The person approves the value proposition before copy is written.
