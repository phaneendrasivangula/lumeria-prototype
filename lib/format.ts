import type { MetricKey, Scan } from "./types";

// Display helpers. Everything here is pure so it can be reused by any screen.

export const METRICS: MetricKey[] = ["redness", "hydration", "evenness", "pigmentation", "oiliness"];

/** How each metric is named, and what a high or low score means in plain words. */
export const METRIC_COPY: Record<MetricKey, { label: string; high: string; mid: string; low: string; means: string }> = {
  redness: {
    label: "Redness",
    high: "Calm",
    mid: "A little flushed",
    low: "Looks red",
    means: "How calm your skin looks. Higher means less redness.",
  },
  hydration: {
    label: "Hydration",
    high: "Well hydrated",
    mid: "A touch dry",
    low: "Looks drier than usual",
    means: "How much water your skin is holding. Higher is plumper.",
  },
  evenness: {
    label: "Texture",
    high: "Smooth",
    mid: "Mostly smooth",
    low: "Uneven",
    means: "How smooth and even the surface looks. Higher is smoother.",
  },
  pigmentation: {
    label: "Tone",
    high: "Even tone",
    mid: "A few darker spots",
    low: "Uneven tone",
    means: "How even your colour is. Higher means fewer dark spots.",
  },
  oiliness: {
    label: "Oil balance",
    high: "Balanced",
    mid: "A little shiny",
    low: "Oilier than usual",
    means: "How balanced your oil is. Higher means less excess shine.",
  },
};

export function band(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 55) return "mid";
  return "low";
}

export function metricWord(key: MetricKey, score: number | null): string {
  if (score == null) return "Not measured";
  return METRIC_COPY[key][band(score)];
}

export function overallWord(score: number): string {
  if (score >= 75) return "Glowing";
  if (score >= 68) return "Looking good";
  if (score >= 60) return "Steady";
  if (score >= 52) return "Needs a little care";
  return "Having a tough time";
}

/** The scan's own time zone when we know it, so "Oct 22" means Noor's Oct 22. Without a location we keep the timestamp's own (UTC) clock rather than guess one. */
export function tzOf(scan: Scan): string {
  return scan.location?.tz ?? "UTC";
}

/** yyyy-mm-dd in the scan's local time zone. */
export function localDay(scan: Scan): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tzOf(scan), year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(scan.takenAt),
  );
}

export function fmtDay(isoDay: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
}

export function fmtScanTime(scan: Scan): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tzOf(scan),
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(scan.takenAt));
}

export function partOfDay(scan: Scan): "Morning" | "Afternoon" | "Evening" {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tzOf(scan), hour: "numeric", hourCycle: "h23" }).format(new Date(scan.takenAt)));
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export function dayNumber(isoDay: string): number {
  const [y, m, d] = isoDay.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
}

export function signed(n: number): string {
  const r = Math.round(n);
  return r > 0 ? `+${r}` : `${r}`;
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
