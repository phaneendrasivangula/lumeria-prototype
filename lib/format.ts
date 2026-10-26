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
  return new Intl.DateTimeFormat("en-CA", { timeZone: tzOf(scan), year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(scan.takenAt));
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

/** A score that may be missing in messy data. Anything that isn't a finite number reads as "not measured". */
export function scoreOf(scan: Scan, key: MetricKey | "overall"): number | null {
  const v = (scan.scores as unknown as Record<string, unknown> | undefined)?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Hour of day (0–24, fractional) in the scan's own time zone. */
export function localHour(scan: Scan): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tzOf(scan), hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(
    new Date(scan.takenAt),
  );
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

export function addDays(isoDay: string, n: number): string {
  return new Date((dayNumber(isoDay) + n) * 864e5).toISOString().slice(0, 10);
}

export function monthName(isoDay: string): string {
  return fmtDay(isoDay, { month: "long" });
}

/** "early August", "mid-August", "late August" */
export function partOfMonth(isoDay: string): string {
  const d = Number(isoDay.slice(8, 10));
  const m = monthName(isoDay);
  return d <= 10 ? `early ${m}` : d <= 20 ? `mid-${m}` : `late ${m}`;
}

/** "Sep 23 – Oct 22", or "Oct 3–7" inside one month. */
export function fmtRange(from: string, to: string, sep = " – "): string {
  if (from === to) return fmtDay(from);
  if (from.slice(0, 7) === to.slice(0, 7) && sep === "–") return `${fmtDay(from)}–${Number(to.slice(8, 10))}`;
  return `${fmtDay(from)}${sep}${fmtDay(to)}`;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const numberWord = (n: number) => WORDS[n] ?? String(n);

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Joins with commas and a final "and": ["a","b","c"] → "a, b and c". */
export function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** How each metric reads when it moves: up is always better. */
export const METRIC_MOVE: Record<MetricKey, { up: string; down: string; adj: string; best: string; worse: string; short: string; tile: string }> = {
  redness: { up: "calmer", down: "redder", adj: "Calmer", best: "calmest", worse: "red", short: "redness", tile: "Redness" },
  hydration: { up: "more hydrated", down: "drier", adj: "More hydrated", best: "most hydrated", worse: "dry", short: "hydration", tile: "Hydration" },
  evenness: { up: "smoother", down: "rougher", adj: "Smoother", best: "smoothest", worse: "rough", short: "texture", tile: "Texture" },
  pigmentation: { up: "more even", down: "less even", adj: "More even", best: "most even", worse: "uneven", short: "tone", tile: "Tone" },
  oiliness: { up: "less shiny", down: "shinier", adj: "Less shiny", best: "least shiny", worse: "shiny", short: "oil balance", tile: "Oil" },
};

/** "Calm"-style one-word reading of a metric that held up, for headlines. */
export const METRIC_STEADY: Record<MetricKey, string> = {
  redness: "Calm",
  hydration: "Hydrated",
  evenness: "Smooth",
  pigmentation: "Even",
  oiliness: "Balanced",
};

/** Gentle one-off words for a single scan, when there is no usual to compare with yet (the first-scan report). */
export function firstScanWord(key: MetricKey, score: number | null): string {
  if (score == null) return "not measured";
  const tier = score >= 70 ? 0 : score >= 60 ? 1 : score >= 50 ? 2 : 3;
  const words: Record<MetricKey, [string, string, string, string]> = {
    hydration: ["well hydrated", "well hydrated", "a touch dry", "dry today"],
    redness: ["calm", "mostly calm", "a little red", "red today"],
    pigmentation: ["even", "fairly even", "a little uneven", "uneven today"],
    evenness: ["smooth", "fairly smooth", "a little uneven", "rough today"],
    oiliness: ["balanced", "a little shiny", "shiny", "shiny today"],
  };
  return words[key][tier];
}

/** Bar colour for a single score: forest when healthy, bronze in the middle, clay when low. */
export function scoreTone(score: number): "good" | "watch" | "alert" {
  return score >= 60 ? "good" : score >= 50 ? "watch" : "alert";
}

/**
 * The photo to show for a scan. Real scope photos (public/scans/*.jpg) are private and never shown by this UI: if the
 * API hands one back, we show that scan's generated placeholder (same name, .svg) instead.
 */
export function photoOf(scan: Scan): string | null {
  const url = scan.photoUrl;
  if (!url) return null;
  return /^\/scans\/[^/]+\.jpe?g$/i.test(url) ? url.replace(/(-polarized|-uva)?\.jpe?g$/i, ".svg") : url;
}
