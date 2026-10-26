# Submission

**Link:** https://lumeria-prototype.vercel.app (best on a phone)

- `/report/noor`, `/report/maya`, `/report/jordan`, `/report/sam`: the report, built in Next.js from the mock API
- `/report/noor?fail=1`: the error state, with retry
- `/prototype/`: the full interactive design (Lumi chat, scan detail, streaks, notifications)

**Time spent:** <!-- Phaneendra: fill in -->

## What I built

Start with `/report/noor` on your phone. The report answers three questions in order:

1. **How is my skin right now?** A dial shows the whole month at once. There is one ring per area, and each mark is one scan, coloured by how calm the skin was that day. In the middle is today's overall score and how it has changed since the start. Below that sit a one-line story ("A rough patch, then your best skin yet") and the latest scan with one thing to try.
2. **Is it getting better?** Each area is compared only with its own usual, because a cheek and a forehead have different normal scores.
3. **Why?** This section shows patterns, a timeline of what happened, and the routine. Each pattern says how sure it is: *Likely*, *Possible* or *Can't separate yet*. "Show data" opens the numbers and the person's own notes behind it.

Every scan opens in a sheet. The sheet has the photo in each light, every score against this area's usual, and the context: city, UV, humidity, sleep, cycle day and notes.

The same code handles the edge cases:
- **Maya:** two areas.
- **Jordan:** one scan. The page becomes a welcome that explains what more scans will unlock.
- **Sam:** unsorted scans, null scores and a missing photo.

The page also has loading (a skeleton), not-found and error states.

`/prototype/` is the high-fidelity design for the parts that go beyond the API: asking Lumi about a pattern, a celebration screen after a scan, and the monthly-report notification. The code tour is in the README.

## Key decisions

- **One rule for every number: higher is better.** Redness and oil balance already work this way in the data. I made that the headline rule, and every colour also has a word, so nobody has to decode a chart.
- **A story before numbers.** People open a skin report to find out "am I OK, and why?", not to read a table. So the headline and the dial come first, and the data sits one tap away.
- **Honest about uncertainty.** Noor switched from retinol to azelaic acid in the same week she was in Phoenix. The report doesn't credit the product with the improvement; it says the two causes can't be separated yet and suggests how to tell them apart. Nothing reads as a diagnosis or a medical claim.
- **Data-driven, not Noor-driven.** `lib/story` has no idea who Noor is. Trips are found from the scan locations, and patterns appear only when the groups are big enough. Tests run all four people through it.
- **Local time everywhere.** A scan taken in Phoenix shows Phoenix time.
- **Accessible by default.** I checked text colours against WCAG AA, and the touch targets are 44 pt or larger. The sheets are native `<dialog>` elements, and the page respects reduced motion. axe-core reports no violations on any route.

## Extra data I assumed

- **Lumi chat (prototype only):** scripted answers grounded in the scans and notes, to show what explaining a pattern could feel like. A real version would need an LLM with strict no-medical-claims guardrails.
- **Streaks (prototype only):** worked out from the scan dates and shown after a scan. Nothing extra is collected.
- **Trip and place photos (prototype only):** illustrative images of Phoenix and of oily skin, used on the pattern orbs.
- The Next.js report uses only what the API returns.

## What I cut / would do next

- **Port the prototype's Lumi chat and post-scan streak into the Next app.** They are designed but not built against the API.
- **A side-by-side photo comparison** of the same area over time, with alignment.
- **Usability tests with real users,** on whether people read the dial correctly without the guide.
- **Visual regression tests** (Playwright screenshots per person) to go with the unit tests.

## How I used AI tools

<!-- Phaneendra: adjust to taste -->
I used Claude as a pair throughout. It helped explore layout variations on the design canvas, write the TypeScript and CSS, run accessibility and contrast checks, and draft copy. I made the product and design calls: the dial concept, the "can't separate yet" honesty, the copy tone, the visual direction, and which variations to keep. I overrode suggestions that drifted toward clinical language or towards adding more charts.

## Anything else

- The real scan photos are git-ignored and never deployed. The live site uses the mock photos.
- `public/prototype/index.html` is generated output from my design canvas, not hand-written code.
