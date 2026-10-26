import type { Scan, SkinReport } from "../types";
import { METRICS, dayNumber, fmtDay, localDay, mean } from "../format";
import { buildEvents } from "./events";
import { buildInsights } from "./patterns";
import type { DayPoint, Story, StoryEvent } from "./types";

// Turns a raw report into the story the report page tells. Pure and data-driven:
// nothing here knows who Noor is, so maya, jordan and sam go through the same code.

const byTime = (a: Scan, b: Scan) => Date.parse(a.takenAt) - Date.parse(b.takenAt);

export function buildStory(report: SkinReport): Story {
  const scans = [...report.scans].sort(byTime).map((scan) => ({ scan, day: localDay(scan) }));
  const latest = scans[scans.length - 1];

  const counts = new Map<string, number>();
  for (const p of scans) counts.set(p.scan.area, (counts.get(p.scan.area) ?? 0) + 1);
  const areas = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
  const primaryArea = areas[0];
  const primary = scans.filter((p) => p.scan.area === primaryArea);

  const start = report.period?.start ?? scans[0].day;
  const end = report.period?.end ?? latest.day;

  // Compare the first and last few scans of the same area, so one noisy scan can't swing the story.
  const k = Math.min(3, Math.max(1, Math.floor(primary.length / 3)));
  const startScore = Math.round(mean(primary.slice(0, k).map((p) => p.scan.scores.overall)));
  const endScore = Math.round(mean(primary.slice(-k).map((p) => p.scan.scores.overall)));
  const low = primary.reduce((m, p) => (p.scan.scores.overall < m.scan.scores.overall ? p : m), primary[0]);
  const best = primary.reduce((m, p) => (p.scan.scores.overall >= m.scan.scores.overall ? p : m), primary[0]);

  let shape: Story["shape"] = "steady";
  if (scans.length === 1) shape = "first";
  else if (low.scan.scores.overall <= startScore - 5 && endScore >= startScore + 3) shape = "rough-then-best";
  else if (endScore >= startScore + 3) shape = "improving";
  else if (endScore <= startScore - 3) shape = "declining";

  const headline = {
    "rough-then-best": "A rough patch, then your best skin yet",
    improving: "Your skin got steadily better",
    declining: "A tougher stretch for your skin",
    steady: "A steady, even stretch",
    first: "Your first scan is in",
  }[shape];

  const events = buildEvents(scans, report.products ?? []);
  const insights = buildInsights(scans, report.products ?? [], primaryArea);

  const subhead = buildSubhead(shape, scans, events, low);

  const days = new Set(scans.map((p) => p.day));
  const weeks = new Set(scans.map((p) => Math.floor((dayNumber(p.day) - dayNumber(start)) / 7)));
  const weeksInPeriod = Math.max(1, Math.ceil((dayNumber(end) - dayNumber(start) + 1) / 7));

  // Metrics where the latest scan of the primary area is the best of the period.
  const last = primary[primary.length - 1];
  const personalBests =
    primary.length >= 4
      ? METRICS.filter((m) => {
          const v = last.scan.scores[m];
          return v != null && primary.every((p) => (p.scan.scores[m] ?? -1) <= v);
        })
      : [];

  return {
    scans,
    latest,
    primaryArea,
    areas,
    primary,
    start,
    end,
    startScore,
    endScore,
    low,
    best,
    shape,
    headline,
    subhead,
    events,
    insights,
    scanDays: days.size,
    weeksActive: weeks.size,
    weeksInPeriod,
    personalBests,
  };
}

function buildSubhead(shape: Story["shape"], scans: DayPoint[], events: StoryEvent[], low: DayPoint): string {
  if (shape === "first") return "Here's where your skin starts. A few more scans and we can show you how it's changing.";
  const trip = events.find((e) => e.kind === "trip");
  if (shape === "rough-then-best") {
    const why = trip ? `around your trip to ${trip.title.replace("Trip to ", "")}` : `around ${fmtDay(low.day)}`;
    return `Your skin had a hard week ${why}, then bounced back past where it started.`;
  }
  if (shape === "improving") return "Most of your scores moved up, and they've held there.";
  if (shape === "declining") return "Your scores dipped lately. Here's what lined up with it, and what to try.";
  return `${scans.length} scans, and your skin stayed close to its usual range.`;
}

