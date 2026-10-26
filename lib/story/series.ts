import type { MetricKey } from "../types";
import { dayNumber, scoreOf } from "../format";
import type { DayPoint, Finding, Story } from "./types";

// Data for the small evidence chart that Show data and Lumi both draw: one measure on one area across the period.

export interface SeriesPoint {
  f: number;
  v: number;
  day: string;
}

export function periodPosition(start: string, end: string, day: string): number {
  return Math.max(0, Math.min(1, (dayNumber(day) - dayNumber(start)) / Math.max(1, dayNumber(end) - dayNumber(start))));
}

export function metricSeries(points: DayPoint[], metric: MetricKey | "overall", start: string, end: string): SeriesPoint[] {
  return points.filter((p) => scoreOf(p.scan, metric) != null).map((p) => ({ f: periodPosition(start, end, p.day), v: scoreOf(p.scan, metric)!, day: p.day }));
}

export interface EvidenceSeries {
  points: SeriesPoint[];
  windows: { f0: number; f1: number; tone: "watch" | "alert" | "good" }[];
  focus?: SeriesPoint;
  metric: MetricKey | "overall";
}

/** What a finding's chart shows: its area's scans for its measure, the stretches it talks about, and the scan it points at. */
export function evidenceSeries(story: Story, f: Finding, start: string, end: string): EvidenceSeries {
  const area = f.area || story.primaryArea;
  const metric = f.metric ?? "overall";
  const pts = story.scans.filter((p) => p.scan.area === area);
  const points = metricSeries(pts, metric, start, end);
  const span = Math.max(1, dayNumber(end) - dayNumber(start));
  const windows = f.windows.map((w) => ({
    f0: periodPosition(start, end, w.from),
    f1: Math.min(1, periodPosition(start, end, w.to) + 1 / span),
    tone: w.tone,
  }));
  const focus = f.focus && f.focus.scan.area === area ? points.find((p) => p.day === f.focus!.day) : undefined;
  return { points, windows, focus, metric };
}
