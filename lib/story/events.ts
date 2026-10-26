import type { Product } from "../types";
import { dayNumber } from "../format";
import type { DayPoint, StoryEvent } from "./types";

// What happened in the period: routine changes, trips (scans away from home) and cycle starts.

function homeCity(scans: DayPoint[]): string | undefined {
  const c = new Map<string, number>();
  for (const p of scans) if (p.scan.location) c.set(p.scan.location.city, (c.get(p.scan.location.city) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function trips(scans: DayPoint[]): { city: string; from: string; to: string; points: DayPoint[] }[] {
  const home = homeCity(scans);
  if (!home) return [];
  const out: { city: string; from: string; to: string; points: DayPoint[] }[] = [];
  for (const p of scans) {
    const city = p.scan.location?.city;
    if (!city || city === home) continue;
    const cur = out[out.length - 1];
    if (cur && cur.city === city && dayNumber(p.day) - dayNumber(cur.to) <= 3) {
      cur.to = p.day;
      cur.points.push(p);
    } else out.push({ city, from: p.day, to: p.day, points: [p] });
  }
  return out;
}

export function buildEvents(scans: DayPoint[], products: Product[]): StoryEvent[] {
  const ev: StoryEvent[] = [];
  const first = scans[0]?.day;
  for (const pr of products) {
    if (pr.startDate > (first ?? "")) ev.push({ kind: "product-start", day: pr.startDate, title: `Started ${shortName(pr)}`, detail: pr.usage });
    if (pr.endDate) ev.push({ kind: "product-stop", day: pr.endDate, title: `Stopped ${shortName(pr)}`, detail: pr.stoppedReason });
  }
  for (const t of trips(scans)) ev.push({ kind: "trip", day: t.from, endDay: t.to, title: `Trip to ${t.city}` });
  for (let i = 1; i < scans.length; i++) {
    const c = scans[i].scan.health?.cycleDay;
    const prev = scans[i - 1].scan.health?.cycleDay;
    if (c != null && prev != null && c < prev) ev.push({ kind: "cycle", day: scans[i].day, title: "Period started", detail: `Cycle day ${c}` });
  }
  return ev.sort((a, b) => a.day.localeCompare(b.day));
}

export function shortName(p: Product): string {
  return p.name.replace(/\s+(Night Serum|Gel|Moisturizer|Serum|Cream)$/i, "").replace(/\s+\d+(\.\d+)?%$/, (m) => m);
}

