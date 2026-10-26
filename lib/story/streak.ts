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
  return { current, best, days: scanned.size, total, marks };
}
