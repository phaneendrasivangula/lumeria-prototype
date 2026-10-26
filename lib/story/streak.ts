import { addDays, dayNumber } from "../format";
import type { Summary } from "./summary";

// The scanning streak, from the scan days alone (nothing extra is collected): the run of days in a row up to the
// latest scan, the best run in the period, and which days of the period have a scan.

export interface Streak {
  /** Days in a row with a scan, ending on the latest scan day. */
  current: number;
  /** The longest such run in the period. */
  best: number;
  /** Days with at least one scan, and days in the period. */
  days: number;
  total: number;
  /** One entry per day of the period, oldest first: was there a scan? */
  marks: boolean[];
  /** The last seven days of the period, as weekday initials and whether each had a scan. */
  week: { label: string; on: boolean }[];
  /** One encouraging line about the next scan. Never a scold. */
  nudge: string;
}

function nudge(current: number, best: number): string {
  if (current === 0) return "Scan today to start a new streak.";
  if (current === 1) return "Scan tomorrow to make it two in a row.";
  if (current < best) return `${best - current + 1} more ${best - current + 1 === 1 ? "day" : "days"} beats your best run of ${best}.`;
  return "Your best run yet. Scan tomorrow to keep it going.";
}

export function buildStreak(summary: Summary): Streak {
  const { story, period } = summary;
  const scanned = new Set(story.scans.map((p) => p.day));
  const total = Math.max(1, dayNumber(period.end) - dayNumber(period.start) + 1);
  const marks = Array.from({ length: total }, (_, i) => scanned.has(addDays(period.start, i)));
  let best = 0;
  let run = 0;
  for (const m of marks) {
    run = m ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let d = story.latest.day; scanned.has(d); d = addDays(d, -1)) current++;
  // weeks since the last scan ("Welcome back"): the run has ended, so the card invites a fresh start instead
  if (summary.welcomeBack) current = 0;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(period.end, i - 6);
    return { label: "SMTWTFS"[new Date(`${d}T12:00:00Z`).getUTCDay()], on: scanned.has(d) };
  });
  return { current, best, days: scanned.size, total, marks, week, nudge: nudge(current, best) };
}
