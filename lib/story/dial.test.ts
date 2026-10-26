import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import mayaJson from "@/data/reports/maya.json";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "../types";
import { buildDial } from "./dial";
import { buildSummary } from "./summary";

const dialFor = (r: SkinReport) => {
  const s = buildSummary(r);
  return buildDial(r, s.story, s.period.start, s.period.end);
};

describe("the dial", () => {
  const noor = dialFor(noorJson as SkinReport);

  it("has one ring per area, most-scanned outermost, one mark per scan", () => {
    expect(noor.rings.map((r) => [r.area, r.marks.length])).toEqual([
      ["Left cheek", 20],
      ["Forehead", 5],
      ["Chin", 2],
    ]);
    expect(noor.rings[0].r).toBeGreaterThan(noor.rings[1].r);
  });

  it("colours each mark by that scan's redness band", () => {
    const bands = noor.rings[0].marks.map((m) => m.band);
    expect(bands).toContain("rough");
    expect(bands[0]).toBe("calm");
    expect(bands[bands.length - 1]).toBe("calm");
  });

  it("keeps marks apart and on the ring", () => {
    for (const ring of noor.rings) {
      for (let i = 1; i < ring.marks.length; i++) expect(ring.marks[i].f0).toBeGreaterThan(ring.marks[i - 1].f1);
      expect(ring.marks.every((m) => m.f0 > 0 && m.f1 < 1)).toBe(true);
    }
  });

  it("marks the trip and the cycle start outside the rings, and products inside", () => {
    expect(noor.markers.map((m) => m.kind)).toEqual(["trip", "cycle"]);
    expect(noor.products.map((p) => [p.active, p.f0 < p.f1])).toEqual([
      [false, true],
      [true, true],
    ]);
  });

  it("switches to dots for longer periods", () => {
    expect(noor.dots).toBe(false);
    expect(dialFor(mayaJson as SkinReport).dots).toBe(true);
  });

  it("copes with unsorted, sparse data", () => {
    const sam = dialFor(samJson as SkinReport);
    expect(sam.rings).toHaveLength(3);
    expect(sam.rings.reduce((n, r) => n + r.marks.length, 0)).toBe(9);
  });
});

describe("what the dial colours by", () => {
  it("is redness, unless redness was calm throughout and another measure is the one to watch", () => {
    expect(buildSummary(noorJson as SkinReport).dialMetric).toBe("redness");
    expect(buildSummary(mayaJson as SkinReport).dialMetric).toBe("redness");
    const sam = buildSummary(samJson as SkinReport);
    expect(sam.dialMetric).toBe("pigmentation");
    const d = buildDial(samJson as SkinReport, sam.story, sam.period.start, sam.period.end, sam.dialMetric);
    expect(d.rings[0].marks.map((m) => m.band)).toEqual(["dipped", "dipped", "rough", "rough", "rough"]);
  });

  it("leaves room for ring names at the start of long periods", () => {
    const maya = dialFor(mayaJson as SkinReport);
    expect(maya.start).toBeGreaterThan(0.08);
    expect(maya.rings.every((r) => r.marks.every((m) => m.f0 >= maya.start))).toBe(true);
  });
});
