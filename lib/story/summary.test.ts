import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import mayaJson from "@/data/reports/maya.json";
import jordanJson from "@/data/reports/jordan.json";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "../types";
import { buildSummary } from "./summary";

const noor = noorJson as SkinReport;
const maya = mayaJson as SkinReport;
const jordan = jordanJson as SkinReport;
const sam = samJson as SkinReport;

describe("summary: noor", () => {
  const s = buildSummary(noor);

  it("leads with the latest overall score and its change since the first scan", () => {
    expect(s.score).toBe(72);
    expect(s.delta).toBe(8);
    expect(s.since).toBe("since Sep 23");
    expect(s.period.label).toBe("Sep 23 – Oct 22");
  });

  it("tells the month in two halves", () => {
    expect(s.headline).toEqual(["A rough start,", "a calm finish."]);
    expect(s.subhead).toMatch(/red and dry during your Phoenix trip, then calmed after you switched to azelaic acid/);
  });

  it("makes the switch to azelaic acid the top insight, with its real numbers", () => {
    expect(s.top?.title).toBe("Calmer since azelaic acid");
    expect(s.top?.body).toBe("Your left cheek has averaged 76 since Oct 13, up from 56 during the retinol weeks.");
    expect(s.top?.confidence).toBe("Likely");
  });

  it("is honest that retinol and the trip overlap, and doesn't repeat the trip as its own pattern", () => {
    expect(s.patterns[0].title).toBe("Retinol, or the dry trip?");
    expect(s.patterns[0].confidence).toBe("Can’t separate yet");
    expect(s.patterns[0].body).toMatch(/forehead dipped too/);
    expect(s.patterns.some((p) => p.kind === "trip")).toBe(false);
    expect(s.patterns.find((p) => p.kind === "sleep")?.confidence).toBe("Possible");
  });

  it("builds the timeline from products, the trip and the cycle", () => {
    expect(s.timeline.map((t) => t.title)).toEqual([
      "Barrier repair moisturizer",
      "Retinol 0.3%",
      "Phoenix trip",
      "Period",
      "Retinol stopped",
      "Azelaic acid 10%",
    ]);
    expect(s.timeline.find((t) => t.title === "Phoenix trip")?.detail).toBe("Hot and dry · redness dipped");
  });

  it("judges each product from its dates", () => {
    expect(s.routine.map((r) => r.status)).toEqual(["Keep", "Stopped", "Too early"]);
    expect(s.routine[2].detail).toBe("Nightly · since Oct 13");
  });

  it("suggests the 2-week test first, then more forehead scans, then the export", () => {
    expect(s.suggestions.map((x) => x.id)).toEqual(["test", "scan-more", "derm"]);
    expect(s.suggestions[1].title).toBe("Scan your forehead twice a week");
  });

  it("orders areas most-scanned first and only shows a change with three or more scans", () => {
    expect(s.areas.map((a) => [a.area, a.score, a.delta])).toEqual([
      ["Left cheek", 72, 8],
      ["Forehead", 66, 1],
      ["Chin", 65, null],
    ]);
  });
});

describe("summary: maya", () => {
  const s = buildSummary(maya);

  it("welcomes her back when the last scan is weeks older than the report", () => {
    expect(s.welcomeBack?.title).toBe("Your last scan was Sep 19, five weeks ago.");
  });

  it("finds the unexplained mid-August week without inventing a cause", () => {
    const dip = s.patterns.find((p) => p.kind === "dip");
    expect(dip?.title).toBe("The mid-August week");
    expect(dip?.body).toMatch(/41–44 on both areas between Aug 8 and Aug 17/);
    expect(dip?.body).toMatch(/can’t say why/);
    expect(s.headline).toEqual(["Steady progress,", "one rough week."]);
  });

  it("uses a clear trend as the top insight when no product explains the month", () => {
    expect(s.top?.title).toBe("More hydrated, both areas");
    expect(s.top?.confidence).toBe("Clear trend");
  });

  it("has no routine, so shows the empty state and no product events", () => {
    expect(s.routine).toEqual([]);
    expect(s.timeline.some((t) => /started|stopped/i.test(t.detail))).toBe(false);
    expect(s.timeline.map((t) => t.title)).toContain("A rough week");
  });
});

describe("summary: jordan", () => {
  const s = buildSummary(jordan);
  it("takes the first-scan path with a 30-day window starting at the scan", () => {
    expect(s.first).toBe(true);
    expect(s.delta).toBeNull();
    expect(s.period.label).toBe("Oct 20 – Nov 18");
    expect(s.patterns).toEqual([]);
    expect(s.suggestions).toEqual([]);
  });
});

describe("summary: sam", () => {
  it("never throws on unsorted scans, null scores and a missing photo", () => {
    expect(() => buildSummary(sam)).not.toThrow();
  });
  const s = buildSummary(sam);

  it("names the missing data instead of hiding it", () => {
    const m = s.patterns.find((p) => p.kind === "missing");
    expect(m?.title).toBe("Oil balance not measured on 5 of 9 scans");
    expect(m?.body).toMatch(/Sep 23 saved no photo/);
  });

  it("says what held steady and what to watch", () => {
    expect(s.headline).toEqual(["Calm skin,", "tone to watch."]);
    expect(s.top?.title).toBe("Tone on your forearm: 57 → 42");
    expect(s.top?.confidence).toBe("Worth watching");
    expect(s.patternsTitle).toBe("Patterns across your skin");
  });

  it("asks for a skin type when it's missing", () => {
    expect(s.suggestions[0].id).toBe("skin-type");
    expect(s.welcomeBack?.title).toBe("19 days since your last scan.");
  });
});

describe("no medical claims", () => {
  const BANNED = /\b(eczema|rosacea|acne|dermatitis|psoriasis|melasma|infection|disease|cure|treat(s|ed|ment)? (your|the) (condition|skin))\b/i;
  for (const r of [noor, maya, jordan, sam]) {
    it(`${r.id}: every line the report writes is a pattern, not a diagnosis`, () => {
      const s = buildSummary(r);
      const copy = [
        s.headline.join(" "),
        s.subhead,
        s.trustNote,
        ...s.findings.flatMap((f) => [f.title, f.body, f.why.body, f.next?.body ?? "", ...f.lumi.paras]),
        ...s.suggestions.flatMap((x) => [x.title, x.body]),
        ...s.timeline.flatMap((t) => [t.title, t.detail]),
        ...s.routine.flatMap((x) => x.script.paras),
      ];
      for (const line of copy) expect(line).not.toMatch(BANNED);
      expect(s.trustNote).toMatch(/not a diagnosis/);
    });
  }
});
