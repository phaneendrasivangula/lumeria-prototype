import type { MetricKey, Product } from "../types";
import { METRICS, METRIC_COPY, dayNumber, fmtDay, mean } from "../format";
import { shortName, trips } from "./events";
import type { DayPoint, Insight } from "./types";

// Patterns: compare groups of scans (a trip vs home, one product vs the next, short vs long nights) within one area,
// and say how sure we are. At most three, strongest first.

function compare(
  group: DayPoint[],
  rest: DayPoint[],
  prefer?: MetricKey,
): { metric: MetricKey; a: number; b: number; diff: number } | null {
  if (group.length < 2 || rest.length < 2) return null;
  let bestM: { metric: MetricKey; a: number; b: number; diff: number } | null = null;
  for (const m of METRICS) {
    const ga = group.map((p) => p.scan.scores[m]).filter((v): v is number => v != null);
    const rb = rest.map((p) => p.scan.scores[m]).filter((v): v is number => v != null);
    if (ga.length < 2 || rb.length < 2) continue;
    const a = mean(ga);
    const b = mean(rb);
    const diff = a - b;
    const score = Math.abs(diff) + (m === prefer ? 2 : 0);
    if (!bestM || score > Math.abs(bestM.diff) + (bestM.metric === prefer ? 2 : 0)) bestM = { metric: m, a, b, diff };
  }
  return bestM;
}

const strength = (n1: number, n2: number, diff: number): Insight["strength"] =>
  n1 >= 3 && n2 >= 3 && Math.abs(diff) >= 8 ? "Clear pattern" : "Worth watching";

const inRange = (day: string, from: string, to: string | null) => day >= from && (to == null || day <= to);

export function buildInsights(scans: DayPoint[], products: Product[], primaryArea: string): Insight[] {
  const out: Insight[] = [];
  // Compare within one area where we can: a forehead and a cheek have different "normal" scores.
  const same = scans.filter((p) => p.scan.area === primaryArea);
  const pool = same.length >= 6 ? same : scans;
  const tripList = trips(scans);

  // 1. Travel
  for (const t of tripList) {
    const g = pool.filter((p) => inRange(p.day, t.from, t.to));
    const home = pool.filter((p) => !inRange(p.day, t.from, t.to));
    const c = compare(g.length >= 2 ? g : t.points, home, "redness");
    if (!c || c.diff > -4) continue;
    const env = t.points.map((p) => p.scan.location!.environment);
    const hum = env.map((e) => e.humidityPct);
    const uv = env.map((e) => e.uvIndexMax);
    const homeHum = Math.round(mean(home.map((p) => p.scan.location?.environment.humidityPct ?? NaN).filter((x) => !isNaN(x))));
    const notes = t.points.map((p) => p.scan.annotation?.note).filter(Boolean) as string[];
    out.push({
      id: `trip-${t.city}`,
      kind: "trip",
      title: `${t.city} was hard on your skin`,
      body: `In ${t.city}, humidity was ${Math.min(...hum)}–${Math.max(...hum)}% (about ${homeHum}% at home) and UV reached ${Math.max(...uv)}. Your ${METRIC_COPY[c.metric].label.toLowerCase()} score fell while you were there.`,
      metric: c.metric,
      a: { label: t.city, value: Math.round(c.a), n: g.length || t.points.length },
      b: { label: "At home", value: Math.round(c.b), n: home.length },
      strength: strength(g.length, home.length, c.diff),
      evidence: [`${fmtDay(t.from)} – ${fmtDay(t.to)}`, ...notes.map((n) => `“${n}”`)],
    });
  }

  // 2. Products: a product that was stopped, followed by one that was started.
  const stopped = products.filter((p) => p.endDate);
  for (const s of stopped) {
    const next = products.find((p) => p.startDate > s.endDate! && p.startDate <= addDays(s.endDate!, 7));
    const during = pool.filter((p) => inRange(p.day, s.startDate, s.endDate));
    if (next) {
      const after = pool.filter((p) => inRange(p.day, next.startDate, next.endDate));
      const c = compare(after, during, "redness");
      if (!c || Math.abs(c.diff) < 4) continue;
      const overlap = tripList.find((t) => t.from <= s.endDate! && t.to >= s.startDate);
      out.push({
        id: `swap-${s.id}`,
        kind: "product",
        title: c.diff > 0 ? `Your skin settled after the switch to ${shortName(next)}` : `Your skin dipped after the switch to ${shortName(next)}`,
        body: `You stopped ${shortName(s)} on ${fmtDay(s.endDate!)}${s.stoppedReason ? ` (${s.stoppedReason.toLowerCase()})` : ""} and started ${shortName(next)} on ${fmtDay(next.startDate)}. Since then your ${METRIC_COPY[c.metric].label.toLowerCase()} score has ${c.diff > 0 ? "climbed" : "slipped"}.`,
        metric: c.metric,
        a: { label: shortName(next), value: Math.round(c.a), n: after.length },
        b: { label: shortName(s), value: Math.round(c.b), n: during.length },
        strength: strength(after.length, during.length, c.diff),
        evidence: [
          `${shortName(s)}: ${fmtDay(s.startDate)} – ${fmtDay(s.endDate!)}`,
          `${shortName(next)}: since ${fmtDay(next.startDate)}`,
        ],
        caveat: overlap
          ? `Your ${overlap.city} trip happened while you were on ${shortName(s)}, so some of that dip may be the trip. A two-week test would tell them apart.`
          : undefined,
      });
    }
  }

  // 3. Sleep, from synced health data or the person's own check-ins.
  const sleepOf = (p: DayPoint) => p.scan.health?.sleepHours ?? p.scan.checkin?.sleepHours;
  const withSleep = pool.filter((p) => sleepOf(p) != null);
  const short = withSleep.filter((p) => sleepOf(p)! < 6);
  const rested = withSleep.filter((p) => sleepOf(p)! >= 7);
  const cs = compare(short, rested);
  if (cs && cs.diff <= -4) {
    out.push({
      id: "sleep",
      kind: "sleep",
      title: `Short nights show up as ${METRIC_COPY[cs.metric].low.toLowerCase()}`,
      body: `After nights under 6 hours, your ${METRIC_COPY[cs.metric].label.toLowerCase()} score averaged ${Math.round(cs.a)}, compared with ${Math.round(cs.b)} after 7 hours or more.`,
      metric: cs.metric,
      a: { label: "Under 6h sleep", value: Math.round(cs.a), n: short.length },
      b: { label: "7h or more", value: Math.round(cs.b), n: rested.length },
      strength: strength(short.length, rested.length, cs.diff),
      evidence: short.map((p) => `${fmtDay(p.day)}: ${sleepOf(p)}h${p.scan.annotation?.note ? ` · “${p.scan.annotation.note}”` : ""}`),
    });
  }

  // 4. Stress, when there isn't a sleep story.
  const stressOf = (p: DayPoint) => p.scan.annotation?.stress ?? p.scan.checkin?.stress;
  const withStress = pool.filter((p) => stressOf(p) != null);
  const high = withStress.filter((p) => stressOf(p)! >= 4);
  const calm = withStress.filter((p) => stressOf(p)! <= 2);
  const cst = compare(high, calm);
  if (cst && cst.diff <= -4 && !out.some((i) => i.kind === "sleep")) {
    out.push({
      id: "stress",
      kind: "stress",
      title: `Stressful days line up with ${METRIC_COPY[cst.metric].low.toLowerCase()}`,
      body: `On days you rated your stress 4 or 5, your ${METRIC_COPY[cst.metric].label.toLowerCase()} score averaged ${Math.round(cst.a)}, compared with ${Math.round(cst.b)} on calm days.`,
      metric: cst.metric,
      a: { label: "Stressful days", value: Math.round(cst.a), n: high.length },
      b: { label: "Calm days", value: Math.round(cst.b), n: calm.length },
      strength: strength(high.length, calm.length, cst.diff),
      evidence: high.slice(0, 4).map((p) => `${fmtDay(p.day)}: stress ${stressOf(p)}/5`),
    });
  }

  // 5. A dip nothing else explains: be honest that we don't know why.
  if (!out.length && pool.length >= 6) {
    for (const m of METRICS) {
      const vals = pool.map((p) => p.scan.scores[m]);
      if (vals.some((v) => v == null)) continue;
      const med = [...(vals as number[])].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
      const dip = pool.filter((p) => (p.scan.scores[m] as number) <= med - 15);
      if (dip.length >= 2) {
        const rest = pool.filter((p) => !dip.includes(p));
        const a = Math.round(mean(dip.map((p) => p.scan.scores[m] as number)));
        const b = Math.round(mean(rest.map((p) => p.scan.scores[m] as number)));
        out.push({
          id: `dip-${m}`,
          kind: "dip",
          title: `${METRIC_COPY[m].label} dipped ${fmtDay(dip[0].day)} – ${fmtDay(dip[dip.length - 1].day)}, then recovered`,
          body: `Your ${METRIC_COPY[m].label.toLowerCase()} score dropped to about ${a} for ${dip.length} scans, then came back to around ${b}. Nothing you logged explains it yet.`,
          metric: m,
          a: { label: "Those scans", value: a, n: dip.length },
          b: { label: "The rest", value: b, n: rest.length },
          strength: "Worth watching",
          evidence: dip.map((p) => `${fmtDay(p.day)} · ${p.scan.area}: ${p.scan.scores[m]}`),
          caveat: "Adding a quick note next time something changes (a new product, travel, a rough night) helps us find the reason.",
        });
        break;
      }
    }
  }

  return out.slice(0, 3);
}

function addDays(day: string, n: number): string {
  const d = new Date((dayNumber(day) + n) * 864e5);
  return d.toISOString().slice(0, 10);
}
