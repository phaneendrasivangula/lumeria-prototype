import { describe, expect, it } from "vitest";
import { arcPath, arcPoint, areaPath, fitY, scaleLinear, smoothPath, sparkline, spreadMarks } from "./charts";

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("chart geometry", () => {
  it("maps a domain onto a range", () => {
    const x = scaleLinear(0, 100, 10, 110);
    expect(x(0)).toBe(10);
    expect(x(50)).toBe(60);
    expect(scaleLinear(5, 5, 0, 10)(5)).toBe(0); // a flat domain doesn't divide by zero
  });

  it("draws a smooth line that passes through every point", () => {
    const pts = [
      { x: 0, y: 10 },
      { x: 10, y: 30 },
      { x: 20, y: 20 },
    ];
    const d = smoothPath(pts);
    expect(d.startsWith("M0.0 10.0")).toBe(true);
    expect(d).toContain("10.0 30.0");
    expect(d.endsWith("20.0 20.0")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it("never loops backwards when two scans sit close together", () => {
    const pts = [
      { x: 0, y: 50 },
      { x: 2, y: 10 },
      { x: 60, y: 60 },
      { x: 62, y: 20 },
    ];
    const d = smoothPath(pts);
    const segs = d.split("C").slice(1).map(nums);
    let prev = 0;
    for (const s of segs) {
      const [c1x, , c2x, , x] = s;
      expect(c1x).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(c2x).toBeLessThanOrEqual(x + 1e-9);
      prev = x;
    }
  });

  it("handles one point or none without throwing", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([{ x: 3, y: 4 }])).toBe("M3.0 4.0");
    expect(areaPath([{ x: 3, y: 4 }], 10)).toBe("");
  });

  it("closes the fill under a line down to its baseline", () => {
    const d = areaPath(
      [
        { x: 0, y: 5 },
        { x: 10, y: 8 },
      ],
      76,
    );
    expect(d.endsWith("L10.0 76.0 L0.0 76.0 Z")).toBe(true);
  });

  it("reads the dial left to right over the top of a semicircle", () => {
    const l = arcPoint(181, 215, 100, 0);
    const top = arcPoint(181, 215, 100, 0.5);
    const r = arcPoint(181, 215, 100, 1);
    expect(l.x).toBeCloseTo(81);
    expect(l.y).toBeCloseTo(215);
    expect(top.x).toBeCloseTo(181);
    expect(top.y).toBeCloseTo(115);
    expect(r.x).toBeCloseTo(281);
    expect(arcPath(181, 215, 100, 0, 1)).toBe("M81.00 215.00 A100.00 100.00 0 0 1 281.00 215.00");
  });

  it("spreads marks so none overlap and all stay on the ring", () => {
    const marks = [0.5, 0.505, 0.51, 0.995].map((c, i) => ({ id: i, f0: c - 0.012, f1: c + 0.012 }));
    const out = spreadMarks(marks, 0.01, 0.01, 0.99);
    for (let i = 1; i < out.length; i++) expect(out[i].f0).toBeGreaterThanOrEqual(out[i - 1].f1 + 0.01 - 1e-9);
    expect(out[out.length - 1].f1).toBeLessThanOrEqual(0.99 + 1e-9);
    expect(out.every((m) => m.f1 - m.f0 > 0.0239)).toBe(true);
  });

  it("fits a y-scale with headroom, and keeps flat data off the edges", () => {
    const y = fitY([47, 84], 10, 63);
    expect(y(84)).toBeCloseTo(10);
    expect(y(47)).toBeCloseTo(63);
    const flat = fitY([60, 60], 10, 70);
    expect(flat(60)).toBeCloseTo(40);
    expect(fitY([], 0, 10)(5)).toBe(5);
  });

  it("puts the latest scan at the card edge and dashes too-few-scan sparklines", () => {
    const sp = sparkline([
      { f: 0, v: 60 },
      { f: 0.3, v: 62 },
      { f: 0.7, v: 66 },
    ]);
    expect(sp.sparse).toBe(false);
    expect(sp.end!.x + sp.shift).toBeCloseTo(194);
    const thin = sparkline([
      { f: 0.6, v: 59 },
      { f: 0.63, v: 65 },
    ]);
    expect(thin.sparse).toBe(true);
    expect(thin.line).toBe("");
    expect(thin.shift).toBe(0);
    // one shared scale: a higher score sits higher on every card
    expect(sparkline([{ f: 0, v: 80 }]).points[0].y).toBeLessThan(sparkline([{ f: 0, v: 50 }]).points[0].y);
  });
});
