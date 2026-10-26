// Chart geometry: pure functions that turn numbers into SVG path strings. No React, no DOM.

export interface Pt {
  x: number;
  y: number;
}

const f1 = (n: number) => n.toFixed(1);
const f2 = (n: number) => n.toFixed(2);

/** A linear map from a domain to a range. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0 || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

/**
 * A smooth line through every point (Catmull–Rom turned into cubic Béziers, the same curve the
 * design boards use). It passes exactly through each point, so a dot drawn on a value sits on the line.
 */
export function smoothPath(pts: Pt[]): string {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    // Control points stay between their two points in x, so close-together scans never loop backwards.
    const lo = Math.min(p1.x, p2.x);
    const hi = Math.max(p1.x, p2.x);
    const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
    const c1 = { x: clamp(p1.x + (p2.x - p0.x) / 6), y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: clamp(p2.x - (p3.x - p1.x) / 6), y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d;
}

/** The smooth line closed down to a baseline, for the soft fill under a chart line. */
export function areaPath(pts: Pt[], baseY: number): string {
  if (pts.length < 2) return "";
  const last = pts[pts.length - 1];
  return `${smoothPath(pts)} L${f1(last.x)} ${f1(baseY)} L${f1(pts[0].x)} ${f1(baseY)} Z`;
}

/**
 * A point on a semicircle that opens downwards: f = 0 is the left end, 0.5 the top, 1 the right end.
 * This is how the dial reads time: left to right, start of the period to the end.
 */
export function arcPoint(cx: number, cy: number, r: number, f: number): Pt {
  const a = Math.PI * (1 - f);
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

/** An arc along that semicircle from f0 to f1 (clockwise, over the top). */
export function arcPath(cx: number, cy: number, r: number, f0: number, f1: number): string {
  const a = arcPoint(cx, cy, r, f0);
  const b = arcPoint(cx, cy, r, Math.max(f0, f1));
  return `M${f2(a.x)} ${f2(a.y)} A${f2(r)} ${f2(r)} 0 0 1 ${f2(b.x)} ${f2(b.y)}`;
}

/** Keeps marks on a ring from overlapping: each starts at least `gap` after the one before, and none runs past `max`. */
export function spreadMarks<T extends { f0: number; f1: number }>(marks: T[], gap: number, min = 0.01, max = 0.99): T[] {
  const out = [...marks].sort((a, b) => a.f0 - b.f0).map((m) => ({ ...m }));
  for (let i = 0; i < out.length; i++) {
    const w = out[i].f1 - out[i].f0;
    const floor = i === 0 ? min : out[i - 1].f1 + gap;
    if (out[i].f0 < floor) {
      out[i].f0 = floor;
      out[i].f1 = floor + w;
    }
  }
  for (let i = out.length - 1; i >= 0; i--) {
    const w = out[i].f1 - out[i].f0;
    const ceil = i === out.length - 1 ? max : out[i + 1].f0 - gap;
    if (out[i].f1 > ceil) {
      out[i].f1 = ceil;
      out[i].f0 = ceil - w;
    }
  }
  return out;
}

/** A y-scale that leaves room above and below the data, so lines never touch the card edge. */
export function fitY(values: number[], top: number, bottom: number, minSpan = 16): (v: number) => number {
  const vs = values.filter((v) => Number.isFinite(v));
  if (!vs.length) return () => (top + bottom) / 2;
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2;
    lo = mid - minSpan / 2;
    hi = mid + minSpan / 2;
  }
  return scaleLinear(lo, hi, bottom, top);
}

export interface Sparkline {
  line: string;
  area: string;
  end: Pt | null;
  points: Pt[];
  /** Too few scans for a trend: draw a dashed join between dots instead of a line. */
  sparse: boolean;
  /** Sideways shift so the latest scan lands at the card's right edge, next to its score. */
  shift: number;
}

/**
 * The area-card sparkline (200 × 92). Every card shares one y-scale (0–100 → the same pixels), so a forehead line and
 * a cheek line can be read against each other; x is the scan's place in the period.
 */
export function sparkline(pts: { f: number; v: number }[], w = 200, h = 92): Sparkline {
  const x = (f: number) => 6 + f * (w - 12);
  const y = (v: number) => Math.max(4, Math.min(h - 4, 136.6 - 1.3625 * v));
  const points = pts.map((p) => ({ x: x(p.f), y: y(p.v) }));
  const sparse = points.length < 3;
  const last = points[points.length - 1] ?? null;
  const shift = !sparse && last ? x(1) - last.x : 0;
  return { line: sparse ? "" : smoothPath(points), area: sparse ? "" : areaPath(points, h), end: last, points, sparse, shift };
}
