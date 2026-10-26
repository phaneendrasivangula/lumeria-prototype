import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import mayaJson from "@/data/reports/maya.json";
import jordanJson from "@/data/reports/jordan.json";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "../types";
import { areaSlug } from "../areas";
import { buildArea, conditionsFor, leadMetric, leadSub, pickFrames, tilesFor } from "./area";
import { buildStory } from "./story";

const noor = noorJson as SkinReport;
const maya = mayaJson as SkinReport;
const jordan = jordanJson as SkinReport;
const sam = samJson as SkinReport;

describe("area detail: noor's left cheek", () => {
  const a = buildArea(noor, "left-cheek")!;

  it("finds the area from its slug and states its scans, score and change", () => {
    expect(a.area).toBe("Left cheek");
    expect(a.countLine).toBe("20 scans · Sep 23 – Oct 22");
    expect(a.score).toBe(72);
    expect(a.delta).toBe(8);
    expect(a.subhead).toMatch(/^You scan this one daily\. Red and dry on the trip, then the calmest it’s been all month\.$/);
  });

  it("leads with redness, her main concern, from 71 to 84", () => {
    expect(a.lead.metric).toBe("redness");
    expect(a.lead.first).toBe(71);
    expect(a.lead.latest).toBe(84);
    expect(a.lead.word).toBe("calmer");
    expect(a.lead.sub).toBe("Your main concern, so it leads your report.");
  });

  it("reads each other measure first scan → latest, with a plain word", () => {
    expect(a.rows.map((r) => `${r.label} ${r.first} → ${r.last} · ${r.word}`)).toEqual([
      "Hydration 56 → 70 · more hydrated",
      "Texture 60 → 76 · smoother",
      "Tone 70 → 75 · more even",
      "Oil balance 61 → 54 · shinier",
    ]);
  });

  it("shades the trip and the cycle start on the chart", () => {
    expect(a.shades.map((s) => s.kind)).toEqual(["trip", "cycle"]);
    expect(a.axis).toEqual(["Sep 23", "Oct 7", "Oct 22"]);
  });

  it("keeps a time-lapse of at most five photos: first, latest and the hardest day", () => {
    expect(a.frames).toHaveLength(5);
    expect(a.frames[0].date).toBe("Sep 23");
    expect(a.frames[4].date).toBe("Oct 22");
    expect(a.frames.every((f) => f.photo?.startsWith("/scans/") || f.photo?.startsWith("/mock-photos/"))).toBe(true);
    expect(a.frames.every((f) => !f.photo?.endsWith(".jpg"))).toBe(true);
  });

  it("only recommends what the scans support", () => {
    expect(a.recs.map((r) => r.status)).toEqual(["Keep going", "Keep", "Worth a try"]);
    expect(a.recs[1].body).toBe("Hydration rose 56 → 70 on your cheek since Sep 23.");
    expect(a.recs[2].body).toMatch(/^Oil balance slipped 61 → 54\./);
  });

  it("offers Lumi questions built from this area's own days and patterns", () => {
    expect(a.questions[0].q).toMatch(/^Why did my cheek dip on Oct \d+\?$/);
    expect(a.questions.some((q) => q.q === "Is azelaic acid helping my cheek?")).toBe(true);
  });
});

describe("area detail: edge cases", () => {
  it("returns nothing for an area the person never scanned", () => {
    expect(buildArea(noor, "left-elbow")).toBeUndefined();
  });

  it("works for every area of every person without throwing", () => {
    for (const r of [noor, maya, jordan, sam]) {
      for (const area of buildStory(r).areas) expect(() => buildArea(r, areaSlug(area))).not.toThrow();
    }
  });

  it("jordan: one scan, so no trend, no change and no recommendations", () => {
    const a = buildArea(jordan, "chin")!;
    expect(a.delta).toBeNull();
    expect(a.frames).toHaveLength(1);
    expect(a.recs).toEqual([]);
    expect(a.rows.every((r) => r.word === "one scan so far")).toBe(true);
    expect(a.lead.metric).toBe("oiliness"); // closest to "Breakouts"
    expect(a.lead.sub).toBe("Closest to your main concern, breakouts, so it leads your report.");
  });

  it("sam: keeps the scan with no photo as a placeholder frame and skips unmeasured oil", () => {
    const a = buildArea(sam, "right-forearm")!;
    expect(a.frames.some((f) => f.photo === null && f.date === "Sep 23")).toBe(true);
    const oil = a.series.oiliness;
    expect(oil.every((p) => Number.isFinite(p.v))).toBe(true);
    expect(oil.length).toBeLessThan(a.points.length);
    expect(a.rows.find((r) => r.metric === "oiliness")?.first).toBe(70);
    const back = buildArea(sam, "upper-back")!;
    expect(back.rows.find((r) => r.metric === "oiliness")?.word).toBe("Not measured");
  });

  it("sam: no stated concern, so the biggest change (tone) leads, and redness joins the other measures", () => {
    const a = buildArea(sam, "right-forearm")!;
    expect(a.lead.metric).toBe("pigmentation");
    expect(a.lead.sub).toBe("The biggest change on this area, so it leads.");
    expect(a.others).toEqual(["hydration", "evenness", "redness", "oiliness"]);
    expect(a.subhead).toBe("Your most-scanned area. Redness stayed calm; dark spots look more visible since late August.");
    expect(a.rows.map((r) => r.word)).toEqual(["a little drier", "a little rougher", "about the same", "3 of 5 scans"]);
  });

  it("maya: the area's own window, its rough week and what improved since", () => {
    const a = buildArea(maya, "left-cheek")!;
    expect(a.countLine).toBe("14 scans · Jul 6 – Sep 16");
    expect(a.subhead).toBe("Your most-scanned area. One red week in mid-August, then more hydrated and calmer than in July.");
  });

  it("maya: no products, so nothing is recommended from a routine", () => {
    expect(buildArea(maya, "left-cheek")!.recs.every((r) => r.status === "Worth a try")).toBe(true);
  });
});

describe("time-lapse rows", () => {
  const story = buildStory(noor);
  const cheek = story.scans.filter((p) => p.scan.area === "Left cheek");

  it("compares each measure with the area's own usual, and says 'usual' for small moves", () => {
    const low = cheek.find((p) => p.scan.scores.redness === 47)!;
    const tiles = tilesFor(low, cheek);
    const red = tiles.find((t) => t.label === "Redness")!;
    expect(red.tone).toBe("alert");
    expect(red.d).toMatch(/^−\d+$/);
    const latest = tilesFor(cheek[cheek.length - 1], cheek).find((t) => t.label === "Redness")!;
    expect(latest.tone).toBe("good");
    expect(latest.d).toMatch(/^\+\d+$/);
  });

  it("reads a measure that wasn't taken as not measured, never as zero", () => {
    const s = buildStory(sam);
    const pts = s.scans.filter((p) => p.scan.area === "Right forearm");
    const oil = tilesFor(pts[0], pts).find((t) => t.label === "Oil")!;
    expect(oil.v).toBeNull();
    expect(oil.d).toBe("–");
  });

  it("flags conditions that are hard on skin", () => {
    const phx = cheek.find((p) => p.scan.location?.city === "Phoenix")!;
    const c = conditionsFor(phx);
    expect(c.find((x) => x.t.startsWith("Humidity"))?.alert).toBe(true);
    expect(c.find((x) => x.t.startsWith("UV"))?.alert).toBe(true);
  });

  it("picks at most five frames, always the first and the latest", () => {
    const f = pickFrames(cheek);
    expect(f).toHaveLength(5);
    expect(f[0]).toBe(cheek[0]);
    expect(f[4]).toBe(cheek[cheek.length - 1]);
    expect(new Set(f).size).toBe(5);
    expect(pickFrames(cheek.slice(0, 2))).toHaveLength(2);
  });
});

describe("lead measure", () => {
  it("maps a person's concern onto the measure that tracks it", () => {
    expect(leadMetric(["Redness"])).toBe("redness");
    expect(leadMetric(["Dryness"])).toBe("hydration");
    expect(leadMetric(["Breakouts"])).toBe("oiliness");
    expect(leadMetric([])).toBe("redness");
    expect(leadSub([], "redness")).toMatch(/Higher means less redness/);
  });
});
