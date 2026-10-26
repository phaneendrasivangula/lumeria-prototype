import type { MetricKey, Product, SkinReport } from "../types";
import { areaInfo } from "../areas";
import {
  METRICS,
  METRIC_COPY,
  METRIC_MOVE,
  addDays,
  cap,
  dayNumber,
  fmtDay,
  fmtRange,
  listJoin,
  mean,
  median,
  monthName,
  numberWord,
  partOfMonth,
  scoreOf,
} from "../format";
import { shortName, trips } from "./events";
import type { Cause, DayPoint, Dip, Finding, Story } from "./types";

// Findings: every pattern the report can show, with its own evidence and its own Lumi script.
// Each one says how sure it is ("Likely", "Possible", "Can’t separate yet"). None of them is a diagnosis.

type Trip = ReturnType<typeof trips>[number];

export const valuesOf = (pts: DayPoint[], m: MetricKey | "overall") => pts.map((p) => scoreOf(p.scan, m)).filter((v): v is number => v != null);
const avg = (pts: DayPoint[], m: MetricKey) => Math.round(mean(valuesOf(pts, m)));
const inRange = (day: string, from: string, to: string | null) => day >= from && (to == null || day <= to);
const label = (m: MetricKey) => METRIC_COPY[m].label.toLowerCase();

/** "azelaic acid" from "Azelaic Acid 10% Gel": how a person would say it out loud. */
export function plainName(p: Product): string {
  return shortName(p)
    .replace(/\s*\d+(\.\d+)?%/g, "")
    .trim()
    .toLowerCase();
}

export function areaPoints(story: Story, area: string): DayPoint[] {
  return story.scans.filter((p) => p.scan.area === area);
}

const lowest = (pts: DayPoint[], m: MetricKey) =>
  pts.reduce<DayPoint | undefined>((lo, p) => {
    const v = scoreOf(p.scan, m);
    return v != null && (lo == null || v < (scoreOf(lo.scan, m) ?? Infinity)) ? p : lo;
  }, undefined);

/** Up to three photos around a moment: the scan before, the moment itself, the scan after. */
function around(pts: DayPoint[], focus: DayPoint | undefined, from: string, to: string): DayPoint[] {
  if (!focus) return pts.slice(-3);
  const before = [...pts].reverse().find((p) => p.day < from);
  const after = pts.find((p) => p.day > to);
  return [before, focus, after].filter((p): p is DayPoint => !!p);
}

/** Trip conditions in a few plain words: "dry", "sunny", "hot". */
function tripAdjective(t: Trip): string {
  const env = t.points.map((p) => p.scan.location!.environment);
  const hum = mean(env.map((e) => e.humidityPct));
  const uv = Math.max(...env.map((e) => e.uvIndexMax));
  const temp = mean(env.map((e) => e.tempHighC));
  if (hum < 30) return "dry";
  if (uv >= 8) return "sunny";
  if (temp >= 32) return "hot";
  return "";
}

/** Which measures fell during a trip, against the scans at home: ["redness", "hydration"]. */
function tripDrops(t: Trip, pool: DayPoint[]): MetricKey[] {
  const g = pool.filter((p) => inRange(p.day, t.from, t.to));
  const home = pool.filter((p) => !inRange(p.day, t.from, t.to));
  if (g.length < 1 || home.length < 2) return [];
  return METRICS.map((m) => ({ m, d: mean(valuesOf(g, m)) - mean(valuesOf(home, m)) }))
    .filter((x) => x.d <= -6)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.m);
}

/** Areas other than `area` whose `m` score also fell during [from, to], against their own usual. */
function alsoDipped(story: Story, area: string, m: MetricKey, from: string, to: string): string[] {
  return story.areas.filter((a) => {
    if (a === area) return false;
    const pts = areaPoints(story, a);
    const during = valuesOf(
      pts.filter((p) => inRange(p.day, from, to)),
      m,
    );
    const usual = median(valuesOf(pts, m));
    return during.length > 0 && mean(during) <= usual - 5;
  });
}

/**
 * Rough stretches: two or more scans close together where one measure fell 12+ points below that area's own usual.
 * Compared per area, because a forehead and a cheek have different "normal" scores.
 */
export function findDips(story: Story): Dip[] {
  const out: Dip[] = [];
  for (const m of METRICS) {
    const usual = new Map(story.areas.map((a) => [a, median(valuesOf(areaPoints(story, a), m))]));
    const low = story.scans.filter((p) => {
      const v = scoreOf(p.scan, m);
      return v != null && areaPoints(story, p.scan.area).length >= 4 && v <= (usual.get(p.scan.area) ?? 0) - 12;
    });
    let run: DayPoint[] = [];
    const flush = () => {
      if (run.length >= 2) {
        const vs = valuesOf(run, m);
        const from = run[0].day;
        const to = run[run.length - 1].day;
        const explained =
          story.events.some((e) => e.kind !== "cycle" && e.day <= to && (e.endDay ?? e.day) >= addDays(from, -3)) ||
          trips(story.scans).some((t) => t.from <= to && t.to >= from);
        out.push({ metric: m, from, to, points: run, min: Math.min(...vs), max: Math.max(...vs), areas: [...new Set(run.map((p) => p.scan.area))], explained });
      }
      run = [];
    };
    for (const p of low) {
      if (run.length && dayNumber(p.day) - dayNumber(run[run.length - 1].day) > 7) flush();
      run.push(p);
    }
    flush();
  }
  return out.sort((a, b) => b.points.length - a.points.length || a.min - b.min);
}

interface Swap {
  stopped: Product;
  next: Product;
  metric: MetricKey;
  after: DayPoint[];
  during: DayPoint[];
  trip?: Trip;
}

/** A product that was stopped and replaced within a week, compared on the main area. */
export function findSwap(story: Story, products: Product[]): Swap | undefined {
  const pool = story.primary;
  for (const s of products.filter((p) => p.endDate)) {
    const next = products.find((p) => p.startDate > s.endDate! && p.startDate <= addDays(s.endDate!, 7));
    if (!next) continue;
    const during = pool.filter((p) => inRange(p.day, s.startDate, s.endDate));
    const after = pool.filter((p) => inRange(p.day, next.startDate, next.endDate));
    if (during.length < 2 || after.length < 2) continue;
    const best = METRICS.map((m) => ({ m, d: mean(valuesOf(after, m)) - mean(valuesOf(during, m)) + (m === "redness" ? 2 : 0) })).sort(
      (a, b) => Math.abs(b.d) - Math.abs(a.d),
    )[0];
    if (!best || Math.abs(best.d) < 4) continue;
    const trip = trips(story.scans).find((t) => t.from <= s.endDate! && t.to >= s.startDate);
    return { stopped: s, next, metric: best.m, after, during, trip };
  }
  return undefined;
}

function productCause(p: Product): Cause {
  return { kind: "product", name: cap(plainName(p)), when: p.endDate ? fmtRange(p.startDate, p.endDate) : `Since ${fmtDay(p.startDate)}` };
}
function tripCause(t: Trip): Cause {
  return { kind: "trip", name: `${t.city} trip`, when: fmtRange(t.from, t.to, "–") };
}

export function buildFindings(report: SkinReport, story: Story): Finding[] {
  const out: Finding[] = [];
  if (story.scans.length < 2) return out;
  const products = report.products ?? [];
  const primary = story.primary;
  const area = story.primaryArea;
  const noun = areaInfo(area).noun;
  const latest = primary[primary.length - 1];

  // 1. A product swap. If the scans after the switch are better, that leads the report ("Likely");
  //    when a trip overlaps the old product, we say plainly that we can't separate the two.
  const swap = findSwap(story, products);
  if (swap) {
    const { stopped: s, next, metric: m, after, during, trip } = swap;
    const a = avg(after, m);
    const b = avg(during, m);
    const up = a > b;
    const today = scoreOf(latest.scan, m);
    out.push({
      id: `swap-${next.id}`,
      kind: "swap",
      confidence: up ? "Likely" : "Possible",
      tone: up ? "good" : "watch",
      title: up ? `${METRIC_MOVE[m].adj} since ${plainName(next)}` : `${cap(METRIC_COPY[m].label)} slipped after ${plainName(next)}`,
      body: `Your ${area.toLowerCase()} has averaged ${a} since ${fmtDay(next.startDate)}, ${up ? "up" : "down"} from ${b} during the ${plainName(s)} weeks.`,
      area,
      areas: [area],
      metric: m,
      sub: `Your ${area.toLowerCase()}, ${fmtDay(next.startDate)} onwards`,
      causes: [productCause(next), productCause(s)],
      windows: [{ from: next.startDate, to: story.end, tone: "good" }],
      focus: after[0],
      groups: {
        title: `On ${plainName(s)} and since`,
        a: { label: `Since ${fmtDay(next.startDate)}`, values: valuesOf(after, m), tone: "good" },
        b: { label: `On ${plainName(s)}`, values: valuesOf(during, m), tone: "neutral" },
      },
      photos: [during[during.length - 1], after[0], latest].filter(Boolean),
      why: {
        title: "Why it’s likely, not certain",
        body: `${after.length} scans since you started is a good sign, but still a short run${trip ? `, and your skin was already recovering from the ${trip.city} trip` : ""}.`,
      },
      next: trip ? { title: "How to find out", body: `Two weeks with nothing new: keep ${plainName(next)}, leave ${plainName(s)} off.` } : undefined,
      cta: trip ? "Run the 2-week test" : undefined,
      lumi: {
        question: `Is ${plainName(next)} helping my ${noun}?`,
        title: up ? `${METRIC_MOVE[m].adj} since ${plainName(next)}` : `After ${plainName(next)}`,
        sub: `Your ${area.toLowerCase()}, ${fmtDay(next.startDate)} onwards`,
        paras: [
          `Your ${area.toLowerCase()} has averaged ${a} since ${fmtDay(next.startDate)}, ${up ? "up" : "down"} from ${b} during the ${plainName(s)} weeks.`,
          `It’s too early to give it all the credit: only ${after.length} scans so far${trip ? `, and your skin was already recovering from the trip when you started` : ""}.`,
          `A 2-week test would show whether it’s the ${plainName(next)}.`,
        ],
        stats: [
          { v: String(b), l: `avg on ${plainName(s)}` },
          { v: String(a), l: "avg since" },
          { v: today == null ? "–" : String(today), l: "today" },
        ],
      },
    });

    if (trip) {
      const g = primary.filter((p) => inRange(p.day, trip.from, trip.to));
      const before = primary.filter((p) => p.day < trip.from);
      const low = lowest(g, m);
      const others = alsoDipped(story, area, m, trip.from, trip.to);
      const adj = tripAdjective(trip);
      const lead = Math.max(0, dayNumber(trip.from) - dayNumber(s.startDate));
      out.push({
        id: `confound-${s.id}`,
        kind: "confound",
        confidence: "Can’t separate yet",
        tone: "alert",
        title: `${cap(plainName(s))}, or the ${adj ? `${adj} ` : ""}trip?`,
        body: `Both landed the week of ${fmtDay(trip.from)}${others.length ? `, and your ${listJoin(others.map((o) => o.toLowerCase()))} dipped too` : ""}, so we can’t tell yet which one it was.`,
        area,
        areas: [area, ...others],
        metric: m,
        sub: `Both landed the week of ${fmtDay(trip.from)}`,
        causes: [productCause(s), tripCause(trip)],
        windows: [
          { from: s.startDate, to: s.endDate!, tone: "watch" },
          { from: trip.from, to: trip.to, tone: "alert" },
        ],
        focus: low,
        groups: {
          title: `In ${trip.city} and at home`,
          a: { label: `In ${trip.city}`, values: valuesOf(g, m), tone: "alert" },
          b: { label: "Home, before", values: valuesOf(before, m), tone: "neutral" },
        },
        photos: around(primary, low, trip.from, trip.to),
        why: {
          title: "Why we can’t tell yet",
          body: `${cap(plainName(s))} started ${lead} day${lead === 1 ? "" : "s"} before you flew, so both overlap the dip.`,
        },
        next: { title: "How to find out", body: `Two weeks with nothing new: no trip and no ${plainName(s)}.` },
        cta: "Run the 2-week test",
        lumi: {
          question: `Was it the ${plainName(s)} or the trip?`,
          title: `${cap(plainName(s))}, or the trip?`,
          sub: `Your ${area.toLowerCase()}, ${fmtRange(s.startDate, s.endDate!)}`,
          paras: [
            `Both happened in the same week, so your scans can’t pull them apart yet.`,
            `In ${trip.city}, your ${noun} averaged ${avg(g, m)} for ${label(m)}, against ${avg(before, m)} at home before you left.`,
            `${cap(plainName(s))} started ${lead} day${lead === 1 ? "" : "s"} before the trip${others.length ? `, and your ${listJoin(others.map((o) => o.toLowerCase()))} dipped too, which points a little more at the trip` : ""}.`,
            `Two quiet weeks, with no trip and no ${plainName(s)}, would tell them apart.`,
          ],
          stats: [
            { v: String(avg(before, m)), l: "home, before" },
            { v: String(avg(g, m)), l: `in ${trip.city}` },
            { v: low ? String(scoreOf(low.scan, m)) : "–", l: "lowest" },
          ],
        },
      });
    }
  }

  // 2. A trip on its own (when no product change overlaps it).
  for (const t of trips(story.scans)) {
    if (swap?.trip && swap.trip.city === t.city && swap.trip.from === t.from) continue;
    const pool = primary.length >= 6 ? primary : story.scans;
    const g = pool.filter((p) => inRange(p.day, t.from, t.to));
    const home = pool.filter((p) => !inRange(p.day, t.from, t.to));
    const drops = tripDrops(t, pool);
    if (!drops.length || g.length < 1) continue;
    const m = drops[0];
    const low = lowest(g, m);
    out.push({
      id: `trip-${t.city}`,
      kind: "trip",
      confidence: g.length >= 3 ? "Likely" : "Possible",
      tone: "alert",
      title: `${t.city} was hard on your skin`,
      body: `Your ${label(m)} averaged ${avg(g, m)} in ${t.city}, against ${avg(home, m)} at home.`,
      area,
      areas: [area],
      metric: m,
      sub: fmtRange(t.from, t.to),
      causes: [tripCause(t)],
      windows: [{ from: t.from, to: t.to, tone: "alert" }],
      focus: low,
      groups: {
        title: `In ${t.city} and at home`,
        a: { label: `In ${t.city}`, values: valuesOf(g, m), tone: "alert" },
        b: { label: "At home", values: valuesOf(home, m), tone: "neutral" },
      },
      photos: around(primary, low, t.from, t.to),
      why: { title: "What we see", body: `Conditions changed a lot in ${t.city}, and your scores moved with them.` },
      lumi: {
        question: `Why was my skin worse in ${t.city}?`,
        title: `${t.city} was hard on your skin`,
        sub: fmtRange(t.from, t.to),
        paras: [
          `Your ${label(m)} averaged ${avg(g, m)} in ${t.city}, against ${avg(home, m)} at home.`,
          `Travel changes a lot at once: air, sun, sleep and routine. Your scans can’t say which one mattered most.`,
        ],
        stats: [
          { v: String(avg(home, m)), l: "at home" },
          { v: String(avg(g, m)), l: `in ${t.city}` },
          { v: low ? String(scoreOf(low.scan, m)) : "–", l: "lowest" },
        ],
      },
    });
  }

  // 3. Sleep and stress: comparisons, so always "Possible". Short nights come from synced health data or check-ins.
  const pool = primary.length >= 6 ? primary : story.scans;
  const habit = (kind: "sleep" | "stress") => {
    const of =
      kind === "sleep"
        ? (p: DayPoint) => p.scan.health?.sleepHours ?? p.scan.checkin?.sleepHours
        : (p: DayPoint) => p.scan.annotation?.stress ?? p.scan.checkin?.stress;
    const known = pool.filter((p) => of(p) != null);
    const a = known.filter((p) => (kind === "sleep" ? of(p)! < 6 : of(p)! >= 4));
    const b = known.filter((p) => (kind === "sleep" ? of(p)! >= 7 : of(p)! <= 2));
    if (a.length < 2 || b.length < 2) return;
    const best = METRICS.map((m) => ({ m, d: mean(valuesOf(a, m)) - mean(valuesOf(b, m)) }))
      .filter((x) => Number.isFinite(x.d))
      .sort((x, y) => x.d - y.d)[0];
    if (!best || best.d > -4) return;
    const m = best.m;
    const av = avg(a, m);
    const bv = avg(b, m);
    const effect: Record<MetricKey, string> = {
      redness: "more redness",
      hydration: "drier skin",
      evenness: "rougher texture",
      pigmentation: "less even tone",
      oiliness: "more shine",
    };
    const lead = kind === "sleep" ? "After nights under 6 h" : "On days you rated your stress 4 or 5";
    const rest = kind === "sleep" ? "after 7 h or more" : "on calmer days";
    const worst = lowest(a, m);
    const bestB = [...b].sort((x, y) => (scoreOf(y.scan, m) ?? 0) - (scoreOf(x.scan, m) ?? 0))[0];
    out.push({
      id: kind,
      kind,
      confidence: "Possible",
      tone: "watch",
      title: `${kind === "sleep" ? "Short nights" : "Stressful days"}, ${effect[m]}`,
      body: `${lead}, ${label(m)} was ${av} (${METRIC_MOVE[m].down}), compared with ${bv} ${rest}.`,
      area: pool === primary ? area : "",
      areas: pool === primary ? [area] : story.areas,
      metric: m,
      sub: kind === "sleep" ? "Nights under 6 h against 7 h or more" : "Stress 4–5 against 1–2",
      causes: [{ kind, name: kind === "sleep" ? "Short nights" : "Stressful days", when: `${a.length} scans` }],
      windows: [],
      focus: worst,
      groups: {
        title: kind === "sleep" ? "Short nights and rested ones" : "Stressful days and calm ones",
        a: { label: kind === "sleep" ? "Under 6 h" : "Stress 4–5", values: valuesOf(a, m), tone: "alert" },
        b: { label: kind === "sleep" ? "7 h or more" : "Stress 1–2", values: valuesOf(b, m), tone: "neutral" },
      },
      photos: [worst, bestB].filter((p): p is DayPoint => !!p),
      why: {
        title: "Why it’s only possible",
        body: `${numberWord(a.length)} ${kind === "sleep" ? "short nights" : "stressful days"} is a small sample, and other things change on those days too.`.replace(
          /^./,
          (c) => c.toUpperCase(),
        ),
      },
      next: { title: "How to be surer", body: `Keep logging ${kind === "sleep" ? "sleep" : "how stressed you feel"} for two more weeks.` },
      lumi: {
        question: kind === "sleep" ? "Do short nights change my skin?" : "Does stress show up in my skin?",
        title: `${kind === "sleep" ? "Short nights" : "Stressful days"}, ${effect[m]}`,
        sub: kind === "sleep" ? `${a.length} nights under 6 h` : `${a.length} days rated 4 or 5`,
        paras: [
          `${lead}, your ${label(m)} score averaged ${av}, compared with ${bv} ${rest}.`,
          `That’s a pattern, not proof: ${numberWord(a.length)} ${kind === "sleep" ? "short nights" : "stressful days"} is a small sample, and other things change on those days too.`,
          `Logging ${kind === "sleep" ? "sleep" : "stress"} for two more weeks would make this clearer.`,
        ],
        stats: [
          { v: String(av), l: kind === "sleep" ? "under 6 h" : "stressful" },
          { v: String(bv), l: kind === "sleep" ? "7 h or more" : "calm days" },
          { v: String(a.length), l: "scans" },
        ],
      },
    });
  };
  habit("sleep");
  if (!out.some((f) => f.kind === "sleep")) habit("stress");

  // 4. An unexplained rough stretch: be honest that we don't know why.
  const dip = findDips(story).find((d) => !d.explained);
  if (dip) {
    const m = dip.metric;
    const when = partOfMonth(dip.points[Math.floor(dip.points.length / 2)].day);
    const areasTxt =
      dip.areas.length === story.areas.length && dip.areas.length > 1
        ? dip.areas.length === 2
          ? "both areas"
          : "all your areas"
        : listJoin(dip.areas.map((a) => `your ${a.toLowerCase()}`));
    const pts = areaPoints(story, dip.areas[0]);
    const low = lowest(dip.points, m);
    const rest = story.scans.filter((p) => !dip.points.includes(p));
    out.push({
      id: `dip-${m}`,
      kind: "dip",
      confidence: null,
      tone: "alert",
      title: `The ${when} week`,
      body: `${cap(METRIC_COPY[m].label)} dropped to ${dip.min}–${dip.max} on ${areasTxt} between ${fmtDay(dip.from)} and ${fmtDay(dip.to)}, then bounced back. Nothing was logged that week, so we can’t say why.`,
      area: dip.areas[0],
      areas: dip.areas,
      metric: m,
      sub: `${fmtRange(dip.from, dip.to)} · ${label(m)}`,
      causes: [{ kind: "time", name: cap(when), when: fmtRange(dip.from, dip.to, "–") }],
      windows: [{ from: dip.from, to: dip.to, tone: "alert" }],
      focus: low,
      groups: {
        title: "That week and the rest",
        a: { label: "That week", values: valuesOf(dip.points, m), tone: "alert" },
        b: { label: "The rest", values: valuesOf(rest, m), tone: "neutral" },
      },
      photos: around(pts, low && low.scan.area === dip.areas[0] ? low : pts.find((p) => dip.points.includes(p)), dip.from, dip.to),
      why: { title: "Why we can’t say yet", body: "Nothing you logged that week lines up with it: no trip, no product change, no note." },
      next: { title: "How to find out", body: "If it happens again, a quick note (travel, a new product, a rough night) helps us find the reason." },
      lumi: {
        question: `Why did my skin dip in ${when}?`,
        title: `The ${when} week`,
        sub: fmtRange(dip.from, dip.to),
        paras: [
          `${cap(METRIC_COPY[m].label)} dropped to ${dip.min}–${dip.max} on ${areasTxt} between ${fmtDay(dip.from)} and ${fmtDay(dip.to)}, then came back.`,
          `Nothing you logged that week lines up with it, so your scans can’t say why. It touched ${dip.areas.length > 1 ? "more than one area at once, which points to something that affected all your skin, like weather or a busy week" : "one area"}.`,
          `If it happens again, add a quick note. That’s usually enough to find the reason.`,
        ],
        stats: [
          { v: `${dip.min}–${dip.max}`, l: "that week" },
          { v: String(Math.round(mean(valuesOf(rest, m)))), l: "usual" },
          { v: String(dip.points.length), l: "scans" },
        ],
      },
    });
  }

  // 5. A measure that stayed calm on every scan, everywhere.
  // Redness is what the dial colours by, so "stayed calm everywhere" is worth saying out loud.
  for (const m of ["redness"] as MetricKey[]) {
    const vs = valuesOf(story.scans, m);
    if (story.scans.length >= 6 && vs.length === story.scans.length && Math.min(...vs) >= 70 && story.areas.length >= 2) {
      out.push({
        id: `steady-${m}`,
        kind: "steady",
        confidence: null,
        tone: "good",
        title: `${cap(METRIC_COPY[m].label)} stayed ${m === "redness" ? "calm" : "steady"}`,
        body: `${cap(METRIC_COPY[m].label)} was ${Math.min(...vs)}–${Math.max(...vs)} on ${story.areas.length === 2 ? "both" : `all ${numberWord(story.areas.length)}`} areas, on every scan.`,
        area,
        areas: story.areas,
        metric: m,
        sub: `${story.scans.length} scans, every area`,
        causes: [],
        windows: [],
        photos: story.scans.slice(-3),
        why: { title: "What we see", body: `Every scan scored 70 or more for ${label(m)}, so it’s holding well.` },
        lumi: {
          question: `Is my ${label(m)} really fine?`,
          title: `${cap(METRIC_COPY[m].label)} stayed steady`,
          sub: `${story.scans.length} scans`,
          paras: [
            `Every scan scored ${Math.min(...vs)} or more for ${label(m)}, on every area.`,
            `That’s a good, steady reading. Nothing here needs changing.`,
          ],
          stats: [
            { v: String(Math.min(...vs)), l: "lowest" },
            { v: String(Math.round(mean(vs))), l: "average" },
            { v: String(Math.max(...vs)), l: "highest" },
          ],
        },
      });
      break;
    }
  }

  // 6. Missing data: say what wasn't measured, so gaps never read as zeros.
  const missing = METRICS.map((m) => ({ m, n: story.scans.filter((p) => scoreOf(p.scan, m) == null).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)[0];
  const noPhoto = story.scans.filter((p) => !p.scan.photoUrl);
  if (missing || noPhoto.length) {
    const photoLine = noPhoto.length
      ? noPhoto.length === 1
        ? `One ${areaInfo(noPhoto[0].scan.area).noun} scan on ${fmtDay(noPhoto[0].day)} saved no photo.`
        : `${cap(numberWord(noPhoto.length))} scans saved no photo.`
      : "";
    out.push({
      id: "missing",
      kind: "missing",
      confidence: "Missing data",
      tone: "watch",
      title: missing ? `${METRIC_COPY[missing.m].label} not measured on ${missing.n} of ${story.scans.length} scans` : "A photo didn’t save",
      body: `${photoLine} Charts skip what wasn’t measured.`.trim(),
      area: noPhoto[0]?.scan.area ?? area,
      areas: story.areas,
      metric: missing?.m ?? null,
      sub: "What we couldn’t measure",
      causes: [],
      windows: [],
      photos: noPhoto.slice(0, 3),
      why: { title: "What this means", body: "A gap is a gap: we don’t guess a number for it, and patterns only use what was measured." },
      lumi: {
        question: "Why are some scores missing?",
        title: "Missing data",
        sub: `${story.scans.length} scans`,
        paras: [
          missing
            ? `${METRIC_COPY[missing.m].label} couldn’t be measured on ${missing.n} of your ${story.scans.length} scans, so those scans show “Not measured” instead of a number.`
            : "",
          photoLine,
          "Good, even light and holding the scope still for a moment usually fixes both.",
        ].filter(Boolean),
        stats: [
          { v: String(story.scans.length), l: "scans" },
          { v: String(missing?.n ?? 0), l: "not measured" },
          { v: String(noPhoto.length), l: "no photo" },
        ],
      },
    });
  }

  return out;
}

/**
 * The biggest first-to-last move on the main area, used as the top insight when no product change explains the month.
 * Rising on every area → "Clear trend"; falling → "Worth watching".
 */
export function buildTrend(story: Story): Finding | undefined {
  if (story.primary.length < 3) return undefined;
  const area = story.primaryArea;
  const first = (pts: DayPoint[], m: MetricKey) => pts.map((p) => scoreOf(p.scan, m)).find((v) => v != null) ?? null;
  const last = (pts: DayPoint[], m: MetricKey) =>
    [...pts]
      .reverse()
      .map((p) => scoreOf(p.scan, m))
      .find((v) => v != null) ?? null;
  const moves = METRICS.map((m) => {
    const a = first(story.primary, m);
    const b = last(story.primary, m);
    return { m, a, b, d: a != null && b != null ? b - a : 0 };
  }).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  const top = moves[0];
  if (!top || Math.abs(top.d) < 5 || top.a == null || top.b == null) return undefined;
  const m = top.m;
  const up = top.d > 0;
  const tracked = story.areas.filter((a) => areaPoints(story, a).length >= 3);
  const sameWay = tracked.filter((a) => {
    const pts = areaPoints(story, a);
    const d = (last(pts, m) ?? 0) - (first(pts, m) ?? 0);
    return up ? d >= 3 : d <= -3;
  });
  const startMonth = monthName(story.primary[0].day);
  const noun = areaInfo(area).noun;
  const fromTo = (a: string) => {
    const pts = areaPoints(story, a);
    return `${first(pts, m)} → ${last(pts, m)} on your ${areaInfo(a).noun}`;
  };
  const tip: Record<MetricKey, string> = {
    pigmentation: `Spots look more visible since ${fmtDay(story.primary[0].day)}. Daily SPF on exposed skin is the simplest way to keep them from darkening.`,
    hydration: `Your skin looks drier since ${fmtDay(story.primary[0].day)}. A richer moisturizer at night is a gentle place to start.`,
    redness: `Your skin looks redder since ${fmtDay(story.primary[0].day)}. A week with fewer actives can help it settle.`,
    evenness: `Texture looks rougher since ${fmtDay(story.primary[0].day)}. A gentle routine and steady moisture usually help.`,
    oiliness: `There’s more shine since ${fmtDay(story.primary[0].day)}. A lighter, oil-free moisturizer may help.`,
  };
  const pts = story.primary;
  const k = Math.max(1, Math.floor(pts.length / 3));
  const both = sameWay.length >= 2;
  return {
    id: `trend-${m}`,
    kind: "trend",
    confidence: up ? "Clear trend" : "Worth watching",
    tone: up ? "good" : "alert",
    title: up
      ? `${METRIC_MOVE[m].adj}, ${both ? (sameWay.length === 2 ? "both areas" : "every area") : `your ${noun}`}`
      : `${cap(METRIC_MOVE[m].short)} on your ${noun}: ${top.a} → ${top.b}`,
    body: up ? `${cap(METRIC_COPY[m].label)} rose ${listJoin((both ? sameWay : [area]).map(fromTo))} since ${startMonth}.` : tip[m],
    area,
    areas: both ? sameWay : [area],
    metric: m,
    sub: `Your ${area.toLowerCase()}, ${fmtRange(story.start, story.end)}`,
    causes: [{ kind: "area", name: area, when: `${pts.length} scans` }],
    windows: [],
    focus: up ? pts[pts.length - 1] : pts[0],
    groups: {
      title: "Early scans and recent ones",
      a: { label: "Recent", values: valuesOf(pts.slice(-k), m), tone: up ? "good" : "alert" },
      b: { label: "Early", values: valuesOf(pts.slice(0, k), m), tone: "neutral" },
    },
    photos: [pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]],
    why: {
      title: up ? "Why it’s a clear trend" : "Why it’s worth watching",
      body: `It moved the same way across ${pts.length} scans${both ? ` and on ${sameWay.length === 2 ? "both" : "all"} areas` : ""}, not just on one day.`,
    },
    lumi: {
      question: up ? `Why is my ${noun} ${METRIC_MOVE[m].up}?` : `Should I worry about my ${METRIC_MOVE[m].short}?`,
      title: up ? `${METRIC_MOVE[m].adj}` : `${cap(METRIC_MOVE[m].short)} to watch`,
      sub: `Your ${area.toLowerCase()}, ${fmtRange(story.start, story.end)}`,
      paras: up
        ? [
            `${cap(METRIC_COPY[m].label)} rose ${listJoin((both ? sameWay : [area]).map(fromTo))} since ${startMonth}.`,
            `It climbed slowly rather than in one jump, which usually means a habit is working rather than a lucky day.`,
            `Keep doing what you’re doing. Your next report will show whether it holds.`,
          ]
        : [
            `${cap(METRIC_MOVE[m].short)} on your ${noun} went from ${top.a} to ${top.b} over ${pts.length} scans.`,
            tip[m],
            `This is a change in your scans, not a diagnosis. If something looks new or changes quickly, a dermatologist can take a proper look.`,
          ],
      stats: [
        { v: String(top.a), l: "first scan" },
        { v: String(top.b), l: "latest" },
        { v: String(pts.length), l: "scans" },
      ],
    },
  };
}
