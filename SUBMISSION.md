# Submission

**Link:** https://lumeria-prototype.vercel.app (best on a phone)

- `/report/noor`, `/report/maya`, `/report/jordan`, `/report/sam`: the monthly report, built in Next.js from the mock API
- `/report/<id>/area/<area>` (e.g. `/report/noor/area/left-cheek`): one area in detail
- `/report/noor?fail=1`: the error state, with retry
- `/prototype/` (add `?person=maya`, `sam` or `jordan`): the full interactive app design, every screen for every person

**Time spent:** <!-- Phaneendra: fill in -->

## What I built

Start with `/report/noor` on your phone. The report answers three questions in order:

1. **How is my skin right now?** A dial shows the whole month at once: one ring per area, one mark per scan, coloured by how calm the skin was that day. In the middle is the latest overall score and how it has changed since the start, then a one-line story ("A rough start, a calm finish.").
2. **Is it getting better?** Each area has its own card, compared only with its own usual, because a cheek and a forehead have different normal scores. Tapping one opens the area page: the person's main concern first, the other four measures, what we noticed there, a photo time-lapse with every score against usual, and questions to ask Lumi.
3. **Why?** Patterns across the face, a timeline of what happened, and the routine. Each pattern says how sure it is: *Likely*, *Possible*, *Can't separate yet*. **Show data** opens the evidence (chart, the two groups compared, the photos); **Explain** opens Lumi, a scripted chat that answers from the person's own numbers.

The same code handles the edge cases:
- **Maya:** two areas, an unexplained red week, and a "Welcome back" banner because her last scan is five weeks old.
- **Jordan:** one scan. The page becomes a welcome that shows what more scans will unlock.
- **Sam:** unsorted scans, unmeasured oil balance, a missing photo and no skin type. Missing values read "Not measured" and charts skip them.

Loading (a breathing dial), not-found and error with retry are all designed states.

`/prototype/` is the same design as an interactive app, beyond what the API covers: Home, the scan sheet, the post-scan streak, reminders, the dermatologist export and the monthly-report notification, each built for every person. The code tour is in the README.

## Key decisions

- **One rule for every number: higher is better.** Redness and oil balance already work this way in the data. I made that the headline rule, and every colour also has a word, so nobody has to decode a chart.
- **A story before numbers.** People open a skin report to find out "am I OK, and why?", not to read a table. So the headline and the dial come first, and the data sits one tap away.
- **Honest about uncertainty.** Noor switched from retinol to azelaic acid in the same week she was in Phoenix. The report doesn't credit the product with the improvement; it says the two causes can't be separated yet and suggests how to tell them apart. Nothing reads as a diagnosis or a medical claim.
- **Data-driven, not Noor-driven.** `lib/story` has no idea who Noor is. Trips are found from the scan locations, and patterns appear only when the groups are big enough. Tests run all four people through it.
- **Local time everywhere.** A scan taken in Phoenix shows Phoenix time.
- **Accessible by default.** I checked text colours against WCAG AA, and the touch targets are 44 pt or larger. The sheets are native `<dialog>` elements, and the page respects reduced motion. axe-core reports no violations on any route.

## Extra data I assumed

- **Lumi chat:** scripted answers built from the person's own scans and notes, to show what explaining a pattern could feel like. A real version would need an LLM with strict no-medical-claims guardrails; a test already scans every generated sentence for diagnosis words.
- **Streaks (prototype only):** worked out from the scan dates and shown after a scan. Nothing extra is collected.
- **Trip and place photos (prototype only):** illustrative images of Phoenix and of oily skin, used on the pattern orbs.
- Everything else in the Next.js report comes from what the API returns. Actions with no backend yet (reminders, the 2-week test, adding a skin type) show a short confirmation instead.

## What I cut / would do next

- **Bring the post-scan streak and Home into the Next app.** They are designed in the prototype but not built against the API.
- **A side-by-side photo comparison** of the same area over time, with alignment.
- **Usability tests with real users,** on whether people read the dial correctly without the guide.
- **Visual regression tests** (Playwright screenshots per person) to go with the unit tests.

## How I used AI tools

<!-- Phaneendra: adjust to taste -->
I used Claude as a pair throughout. It helped explore layout variations on the design canvas, write the TypeScript and CSS, run accessibility and contrast checks, and draft copy. I made the product and design calls: the dial concept, the "can't separate yet" honesty, the copy tone, the visual direction, and which variations to keep. I overrode suggestions that drifted toward clinical language or towards adding more charts.

## Anything else

- The real scan photos are git-ignored and never deployed. The live site uses the mock photos.
- `public/prototype/index.html` is generated output from my design canvas, not hand-written code.
