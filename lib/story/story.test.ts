import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import mayaJson from "@/data/reports/maya.json";
import jordanJson from "@/data/reports/jordan.json";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "../types";
import { buildStory } from "./index";

// Each person stresses the engine differently (README → "The data"). These tests pin the behaviour the UI relies on.
const noor = noorJson as SkinReport;
const maya = mayaJson as SkinReport;
const jordan = jordanJson as SkinReport;
const sam = samJson as SkinReport;

describe("noor: one month, every field", () => {
  const story = buildStory(noor);

  it("tells the rough-then-best story of the month", () => {
    expect(story.shape).toBe("rough-then-best");
    expect(story.headline).toMatch(/rough patch/i);
    expect(story.subhead).toMatch(/Phoenix/);
  });

  it("uses the most-scanned area for the trend, so like is compared with like", () => {
    expect(story.primaryArea).toBe("Left cheek");
    expect(story.primary.every((p) => p.scan.area === "Left cheek")).toBe(true);
  });

  it("finds the Phoenix trip in the timeline from scan locations alone", () => {
    const trip = story.events.find((e) => e.kind === "trip");
    expect(trip).toBeDefined();
    expect(trip!.title).toBe("Trip to Phoenix");
    expect((trip!.endDay ?? trip!.day) >= trip!.day).toBe(true);
  });

  it("flags the retinol → azelaic acid switch, but is honest that the trip overlaps it", () => {
    const swap = story.insights.find((i) => i.kind === "product");
    expect(swap).toBeDefined();
    expect(swap!.caveat).toMatch(/Phoenix/);
  });

  it("returns at most three patterns", () => {
    expect(story.insights.length).toBeLessThanOrEqual(3);
  });

  it("counts scan days in the person's own time zone", () => {
    expect(story.scanDays).toBe(25);
  });
});

describe("maya: steady progress with a rough patch", () => {
  const story = buildStory(maya);

  it("reads as an improving stretch across both areas", () => {
    expect(story.areas).toHaveLength(2);
    expect(["improving", "rough-then-best"]).toContain(story.shape);
    expect(story.endScore).toBeGreaterThan(story.startScore);
  });

  it("has no routine, so no product patterns or product events", () => {
    expect(story.insights.some((i) => i.kind === "product")).toBe(false);
    expect(story.events.some((e) => e.kind.startsWith("product"))).toBe(false);
  });
});

describe("jordan: exactly one scan", () => {
  const story = buildStory(jordan);

  it("takes the first-scan path instead of inventing a trend", () => {
    expect(story.shape).toBe("first");
    expect(story.insights).toEqual([]);
    expect(story.latest.scan.id).toBe(jordan.scans[0].id);
  });
});

describe("sam: sparse, unsorted, missing fields", () => {
  const story = buildStory(sam);

  it("sorts scans oldest → newest even though the API doesn't", () => {
    const times = story.scans.map((p) => Date.parse(p.scan.takenAt));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(story.latest.scan.takenAt).toBe(sam.scans.map((s) => s.takenAt).sort().at(-1));
  });

  it("copes with unmeasured oil balance and a missing photo", () => {
    expect(sam.scans.some((s) => s.scores.oiliness === null)).toBe(true);
    expect(sam.scans.some((s) => s.photoUrl === null)).toBe(true);
    expect(() => buildStory(sam)).not.toThrow();
    for (const i of story.insights) expect(Number.isFinite(i.a.value) && Number.isFinite(i.b.value)).toBe(true);
  });

  it("keeps every area, most-scanned first", () => {
    expect(story.areas).toHaveLength(3);
  });
});
