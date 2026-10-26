# Submission

**Link:** https://lumeria-prototype.vercel.app/report/noor (best on a phone)

Other people and states, if you want to poke around:
- `/report/maya`, `/report/sam`, `/report/jordan`
- `/report/noor/area/left-cheek` for one area in detail
- `/report/noor?fail=1` for the error state
- `/prototype/` (add `?person=maya`, `sam` or `jordan`) for the wider app design: Home, scanning, streaks, reminders

**Time spent:** About 7 hours.

## What I built

Open Noor's link on your phone. After a short load you get a reveal: the month in one number and one sentence, with the ring drawing itself to her score. **See your report** takes you into the summary. If you'd rather skim, **View quick insights** swipes through the month in four cards.

The summary tries to answer three questions, in this order:

1. **How is my skin right now?** One line of story first ("A rough start, a calm finish."), then a dial that shows the whole month at once: one ring per area, one mark per scan, coloured by how calm the skin was that day. The middle has the latest score and how much it moved.
2. **Is it getting better?** A card for each area, compared only with that area's own usual. A cheek and a forehead have different normals, so comparing them to each other would be misleading. Tap one to see the area in detail: the main concern, the other measures, a before-and-after of the first and latest photo, and every scan over time.
3. **Why?** What might be related, a timeline of what happened, and the routine. Every pattern says how sure it is (*Likely*, *Possible*, *Can't separate yet*). **Show data** opens the evidence and **Explain** opens Lumi, which answers from the person's own numbers.

Near the bottom there's a small glass streak card, to nudge people to keep scanning. It's worked out from the scan dates only.

The same code handles the awkward cases:
- **Maya** has two areas, a red week nobody can explain, and hasn't scanned in five weeks, so she gets a "Welcome back".
- **Jordan** has one scan, so his report becomes a welcome that shows what more scans will unlock.
- **Sam** has unsorted scans, a measure that was never taken, a missing photo and no skin type. Gaps say "Not measured" and the charts skip them.

Loading, error (with retry), not found and empty all have their own designed screens. The API is slow on purpose, so the first load happens on the reveal's own screen and flows straight into it.

## How I got here

**1. Reading the data first.** Before drawing anything I went through all four people's scans and wrote down what their month actually looked like. Noor's was the interesting one: she started retinol the same week she flew to dry Phoenix and her skin got red, then switched to azelaic acid and calmed down. That told me the report couldn't just blame or credit one thing.

**2. Talking to people.** I asked two friends what they'd want from a monthly skin report. Later, once there was something to click, they used it and I watched where they got stuck. These sessions covered two things: what they wanted to get out of the report, and whether they could actually use it.

**3. Rough layouts in Figma.** I sketched the layouts and the card ideas I wanted to explore in Figma. That's also where the dial idea started: one picture of the whole month instead of a row of charts.

**4. Variations.** I built on the Figma work with Claude and explored a few directions for each of the main pieces:
- **Summary:** different orders and densities until the story, dial and area cards read top to bottom.
- **Quick insight cards:** plain cards first, then glass and gradient versions. I picked one and made it taller, with more room to breathe.
- **The reveal:** a few takes inspired by how Apple Health and Whoop open their results. I chose one and moved it into Lumeria's colours (an evergreen dusk), tried several ring patterns and kept the fine halo ticks.
- **Streak card:** three versions. I kept the simplest, a single vertical glass card with a gentle parallax tilt.
- **Things I dropped:** I thought about a "skin age" card and left it out. It's a single number that sounds like a medical judgement, which goes against the rest of the report.

**5. Testing more cases.** Two people can't cover every case, so I also used a repo of artificial users to run more scenarios through the report: different gaps, missing data, single scans and so on. The story logic (`lib/story`) has tests that run all four real people through it too.

**6. Cutting words.** Every early version had too much text. I cut each card down to one sentence and moved the detail behind **Show data** and **Explain**.

## Key decisions

- **Higher is always better.** Redness and oil balance already work that way in the data, so I made it the rule for every number. Every colour also comes with a word, so nobody has to decode a chart.
- **Story before numbers.** People open a skin report to find out "am I OK, and why?", not to read a table. The headline and dial come first, and the data is one tap away.
- **Honest about what we don't know.** Noor's red week lined up with both the retinol and the Phoenix trip. The report doesn't pick one. It says they can't be separated yet, and suggests a 2-week test to tell them apart. Nothing reads as a diagnosis.
- **Nothing is written for Noor.** `lib/story` doesn't know who anyone is. Trips are found from scan locations, and a pattern only shows up when there's enough data behind it.
- **Local time.** A scan taken in Phoenix shows Phoenix time.
- **Geist instead of Montserrat.** I started with Montserrat, but it didn't work for the people reading the report or for the theme. Its wide, geometric letters felt loud next to the calm, soft look, and long sentences and lots of numbers were harder to read on a phone. Geist is quieter and easier to read at small sizes, and its numbers line up neatly, so the scores and the dial feel calmer.
- **Accessible.** Text contrast meets WCAG AA, touch targets are at least 44pt, the sheets are native `<dialog>`s, and reduced motion is respected. axe-core finds no issues on any page.

## Extra data I assumed

- **Lumi:** scripted answers built from the person's own scans and notes, to show what explaining a pattern could feel like. A real version would need an LLM with strict no-medical-claims guardrails. A test already checks every generated sentence for diagnosis words.
- **Streaks:** worked out from the scan dates only. Nothing extra is collected.
- **Trip and place photos (prototype only):** illustrative images used on the pattern screens.
- Everything else in the report comes from the API. Actions with no backend yet (reminders, the 2-week test, adding a skin type) show a short confirmation.

## What I'd do next

- Build Home and the post-scan streak into the real app. They're designed in the prototype but not wired to the API.
- Line up the before-and-after photos so the two scans match exactly.
- Test with more people, especially on whether the dial makes sense without the guide.
- Add screenshot tests for each person alongside the unit tests.

## How I used AI tools

I started in Figma, laying out the screens and card ideas I wanted to try. Then I used Claude to build on top of that: generating variations to compare, writing the TypeScript and CSS, and running accessibility and contrast checks. I made the product and design calls myself: the dial, being upfront about "can't separate yet", the tone, the visual direction and which variations to keep. When suggestions drifted towards clinical language or more charts, I pushed back.

## Anything else

- The real scan photos are git-ignored and never deployed. The live site uses mock photos.
- `public/prototype/index.html` is exported from my design work, not hand-written code.

## Appendix: the full process, step by step

For anyone curious, this is everything that came before the final screens. Most of it lives on my design canvas: close to 490 screens across all the rounds.

**Research and framing**

1. **Data from the prompt.** I went through all four people's scans, scores and notes, and wrote down what each month actually looked like.
2. **User research.** I talked with two friends about how they track their skin and what they'd want from a monthly report, then grouped what I heard into themes.
3. **Secondary research.** I read up on how people talk about skin changes, and on how health and fitness apps report progress.
4. **Journey map.** From the push notification, to opening the report, to deciding what to do next.
5. **Scenario map.** The good month, the bad month, the first scan, coming back after a gap, and messy data.
6. **Opportunities.** What the user needs, what Lumeria needs, and a few bigger what-ifs.
7. **Inspiration.** Direct (skin and health apps), indirect (Apple Health, Whoop) and a few out-of-the-box picks.

**Exploration**

8. **Early app explorations.** 14 rounds (v3 to v16) of the wider app, covering the weekly loop, the skin score, the colours and glass, and the onboarding, scan, Lumi and routine flows.
9. **Quick takes.** Eight fast "Ups" on Noor's October report, plus sketches of the ambitious what-ifs from step 6. In total, 18 screens.
10. **End-to-end wireframes.** Noor's whole report, made clickable: the story, the chapters, the sheets, the edge cases (Jordan, Maya, Sam) and the loading and error states.

**Structure: flows and IA**

11. **Flow maps.** Every screen once, with a line for every tap: the ways in, the summary, what opens from it, the detail screens, and where it ends.
12. **New information architecture.** The summary became the global view: score, top insight, areas, patterns, what happened, routine and suggestions. Each area got its own page.

**Visual design**

13. **Visual directions.** Two rounds of five, so ten directions in all, followed by infographic variations that showed more information for the same month.
14. **The summary chart.** 14 dial variations before I settled on the ring.
15. **Report depth.** Three depths (glance, closer, deep dive), then a second version of the report built on real scans with clearer navigation.

**Testing and final polish**

16. **Usability sessions.** My two friends used the clickable version. I fixed what tripped them up and checked the report against their goals.
17. **Artificial users.** I ran more scenarios through a repo of synthetic users to catch cases four people can't cover.
18. **Final details.** I tried four card surfaces for quick insights, several takes on the reveal (then the Lumeria palette and four ring patterns) and three streak cards. I also cut the copy down to one sentence a card.
19. **Build.** I built it in Next.js against the mock API, checked every person's screens, tested loading, error, not-found and empty, and ran an accessibility audit on every page.
