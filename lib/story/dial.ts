import type { MetricKey, SkinReport } from "../types";
import { areaInfo, type Glyph } from "../areas";
import { type Band, bandOf } from "../bands";
import { arcPoint, spreadMarks } from "../charts";
import { dayNumber, localHour, scoreOf } from "../format";
import { trips } from "./events";
import { periodFraction } from "./summary";
import type { Story } from "./types";

// The Summary dial: one ring per area (most-scanned outermost), one mark per scan, coloured by that scan's
// redness band; products as thin inner arcs; trips and cycle starts as small markers outside the rings.

export const DIAL = { w: 362, h: 254, cx: 181, cy: 215 } as const;

const RADII = [164.55, 142.5, 120.5, 100.5];
const TRACK = [15.3, 10, 7.7, 6.2];
const MARK = [13.8, 8.5, 6.2, 5];
// Long periods: each scan is a dot, so marks are a little bigger to stay legible.
const TRACK_DOTS = [21.9, 14.3, 10.5, 8];
const MARK_DOTS = [15.8, 9.7, 7.2, 6];
const DOTS_START = 0.09;

export interface DialMark {
  id: string;
  f0: number;
  f1: number;
  band: Band | "none";
  /** x of the mark's centre, for the colour gradient along the ring. */
  x: number;
}

export interface DialRing {
  area: string;
  /** Short name for the ring label: "Cheek", "Forearm". */
  label: string;
  glyph: Glyph;
  r: number;
  track: number;
  width: number;
  marks: DialMark[];
}

export interface DialMarker {
  kind: "trip" | "cycle";
  label: string;
  x: number;
  y: number;
}

export interface DialProduct {
  name: string;
  f0: number;
  f1: number;
  active: boolean;
  r: number;
}

export interface DialModel {
  dots: boolean;
  /** The measure each mark is coloured by: redness, unless redness was calm throughout and another measure is the one to watch. */
  metric: MetricKey;
  /** Where the rings start (0 = the left end). Long periods leave room at the bottom left for the ring names. */
  start: number;
  rings: DialRing[];
  markers: DialMarker[];
  products: DialProduct[];
}

export function buildDial(report: SkinReport, story: Story, start: string, end: string, metric: MetricKey = "redness"): DialModel {
  const days = dayNumber(end) - dayNumber(start) + 1;
  const dots = days > 31;
  const areas = story.areas.slice(0, RADII.length);
  const lead = dots ? DOTS_START : 0;
  const frac = (day: string, hour = 12) => lead + (1 - lead) * periodFraction(start, end, day, hour);

  const rings: DialRing[] = areas.map((area, i) => {
    const r = RADII[i];
    const width = (dots ? MARK_DOTS : MARK)[i];
    const pts = story.scans.filter((p) => p.scan.area === area);
    // Arc length of one mark: about 4.3° on the outer ring; dots have no length at all.
    const len = dots ? 0 : 0.024 * (RADII[0] / r);
    const gap = (width + 2.5) / (Math.PI * r);
    const raw = pts.map((p) => {
      const c = frac(p.day, localHour(p.scan));
      const red = scoreOf(p.scan, metric);
      return { id: p.scan.id, f0: c - len / 2, f1: c + len / 2, band: red == null ? ("none" as const) : bandOf(red), x: 0 };
    });
    const marks = spreadMarks(raw, dots ? gap : gap * 0.35, lead + 0.012 + width / (2 * Math.PI * r), 0.988 - width / (2 * Math.PI * r)).map((m) => ({
      ...m,
      x: arcPoint(DIAL.cx, DIAL.cy, r, (m.f0 + m.f1) / 2).x,
    }));
    return { area, label: areaInfo(area).label, glyph: areaInfo(area).glyph, r, track: (dots ? TRACK_DOTS : TRACK)[i], width, marks };
  });

  const outer = (rings[0]?.r ?? RADII[0]) + 28.5;
  const markers: DialMarker[] = [];
  for (const t of trips(story.scans)) {
    const p = arcPoint(DIAL.cx, DIAL.cy, outer, frac(t.points[0].day, localHour(t.points[0].scan)));
    markers.push({ kind: "trip", label: t.city, x: p.x, y: p.y });
  }
  for (const e of story.events.filter((x) => x.kind === "cycle")) {
    const scan = story.scans.find((p) => p.day === e.day);
    const p = arcPoint(DIAL.cx, DIAL.cy, outer, frac(e.day, scan ? localHour(scan.scan) : 12));
    markers.push({ kind: "cycle", label: "Period", x: p.x, y: p.y });
  }

  const inner = (rings[rings.length - 1]?.r ?? RADII[0]) - 14;
  const products: DialProduct[] = (report.products ?? [])
    .filter((p) => p.startDate > start && p.startDate <= end)
    .map((p) => ({
      name: p.name,
      f0: Math.min(0.98, frac(p.startDate, 0) + 0.02),
      f1: Math.min(0.995, frac(p.endDate && p.endDate < end ? p.endDate : end, 24) - (p.endDate && p.endDate < end ? 0.01 : 0)),
      active: !p.endDate || p.endDate >= end,
      r: inner,
    }));

  return { dots, metric, start: lead ? lead - 0.002 : 0, rings, markers, products };
}
