import type { MetricKey, SkinReport } from "../types";
import { areaInfo, findArea } from "../areas";
import { METRICS, METRIC_COPY, METRIC_MOVE, cap, dayNumber, fmtDay, fmtRange, listJoin, median, monthName, partOfMonth, photoOf, scoreOf } from "../format";
import { trips } from "./events";
import { areaPoints, findDips, findSwap, plainName, valuesOf } from "./findings";
import { type Summary, buildSummary, productImage } from "./summary";
import type { DayPoint, Finding, LumiScript } from "./types";

// The area detail page (e.g. Left cheek): its own trend, its own patterns, its photos, and what to try.

export interface SeriesPoint {
  f: number; // 0–1 across the period
  v: number;
  day: string;
}

export interface MetricRow {
  metric: MetricKey;
  label: string;
  first: number | null;
  last: number | null;
  word: string; // "more hydrated", "Not measured"
}

export interface Tile {
  label: string;
  v: number | null;
  /** Against this area's own usual: "usual", "+6", "−17", or "–" when not measured. */
  d: string;
  tone: "neutral" | "good" | "alert";
}

export interface Frame {
  scan: DayPoint;
  date: string;
  place: string | null;
  photo: string | null;
  overall: number | null;
  tiles: Tile[];
  conditions: { t: string; alert: boolean }[];
  note: string | null;
}

export interface Rec {
  id: string;
  status: "Keep going" | "Keep" | "Worth a try";
  tone: "good" | "watch";
  eyebrow: string;
  name: string;
  body: string;
  image: string | null;
}

export interface AreaDetail {
  summary: Summary;
  area: string;
  info: ReturnType<typeof areaInfo>;
  points: DayPoint[];
  countLine: string; // "20 scans · Sep 23 – Oct 22"
  score: number | null;
  delta: number | null;
  since: string;
  subhead: string;
  lead: { metric: MetricKey; title: string; sub: string; latest: number | null; first: number | null; word: string; up: boolean | null };
  series: Record<MetricKey, SeriesPoint[]>;
  others: MetricKey[];
  rows: MetricRow[];
  shades: { f0: number; f1: number; kind: "trip" | "cycle" }[];
  axis: [string, string, string];
  trustNote: string;
  findings: Finding[];
  frames: Frame[];
  questions: { q: string; findingId?: string; script: LumiScript }[];
  recs: Rec[];
}

/** Which measure leads the page: the person's first concern that maps to one, else redness. */
export function leadMetric(concerns: string[]): MetricKey {
  for (const c of concerns.map((x) => x.toLowerCase())) {
    if (c.includes("red")) return "redness";
    if (c.includes("dry") || c.includes("hydrat")) return "hydration";
    if (c.includes("texture")) return "evenness";
    if (c.includes("spot") || c.includes("pigment") || c.includes("tone")) return "pigmentation";
    if (c.includes("oil") || c.includes("shine") || c.includes("breakout")) return "oiliness";
  }
  return "redness";
}

/** Why this measure leads the page, in the person's own words where we have them. */
export function leadSub(concerns: string[], lead: MetricKey): string {
  const c = concerns.find((x) => leadMetric([x]) === lead);
  if (!c) return METRIC_COPY[lead].means;
  return c.toLowerCase().includes(METRIC_COPY[lead].label.toLowerCase().split(" ")[0])
    ? "Your main concern, so it leads your report."
    : `Closest to your main concern, ${c.toLowerCase()}, so it leads your report.`;
}

/** First scan → latest in a word: small moves say "a little". */
export function moveWord(m: MetricKey, a: number | null, b: number | null): string {
  if (a == null || b == null) return "Not measured";
  const d = b - a;
  if (Math.abs(d) < 2) return "about the same";
  const w = d > 0 ? METRIC_MOVE[m].up : METRIC_MOVE[m].down;
  return Math.abs(d) < 5 ? `a little ${w}` : w;
}

/** The measure that moved most on an area, first scan to latest: it leads the page when the person named no concern. */
export function biggestMove(pts: DayPoint[]): MetricKey | undefined {
  if (pts.length < 2) return undefined;
  return METRICS.map((m) => {
    const vs = valuesOf(pts, m);
    return { m, d: vs.length >= 2 ? Math.abs(vs[vs.length - 1] - vs[0]) : 0 };
  }).sort((a, b) => b.d - a.d)[0]?.m;
}

/** The "vs usual" tiles for one scan: each measure against this area's own median for the period. */
export function tilesFor(scan: DayPoint, pts: DayPoint[]): Tile[] {
  return METRICS.map((m) => {
    const v = scoreOf(scan.scan, m);
    const usual = median(valuesOf(pts, m));
    if (v == null) return { label: METRIC_MOVE[m].tile, v: null, d: "–", tone: "neutral" as const };
    const d = Math.round(v - usual);
    if (!Number.isFinite(d) || Math.abs(d) < 3 || pts.length < 3) return { label: METRIC_MOVE[m].tile, v, d: "usual", tone: "neutral" as const };
    return { label: METRIC_MOVE[m].tile, v, d: d > 0 ? `+${d}` : `−${-d}`, tone: d > 0 ? ("good" as const) : ("alert" as const) };
  });
}

/** Conditions on the day, flagged when they're hard on skin: strong sun, very dry air, a short night. */
export function conditionsFor(p: DayPoint): { t: string; alert: boolean }[] {
  const out: { t: string; alert: boolean }[] = [];
  const env = p.scan.location?.environment;
  if (env) {
    out.push({ t: `UV ${env.uvIndexMax}`, alert: env.uvIndexMax >= 8 });
    out.push({ t: `Humidity ${env.humidityPct}%`, alert: env.humidityPct < 30 });
    out.push({ t: `${env.tempHighC}°C`, alert: false });
  }
  const sleep = p.scan.health?.sleepHours ?? p.scan.checkin?.sleepHours;
  if (sleep != null) out.push({ t: `Slept ${sleep} h`, alert: sleep < 6 });
  const water = p.scan.health?.waterGlasses ?? p.scan.checkin?.waterGlasses;
  if (!env && water != null) out.push({ t: `${water} glass${water === 1 ? "" : "es"} of water`, alert: water < 4 });
  const stress = p.scan.annotation?.stress ?? p.scan.checkin?.stress;
  if (!env && stress != null) out.push({ t: `Stress ${stress} of 5`, alert: stress >= 4 });
  return out;
}

/**
 * Up to five photos for the time-lapse: the first and latest scan, the hardest day, and evenly spaced scans between.
 * Scans without a photo stay in (with a placeholder) so a gap is shown honestly rather than skipped silently.
 */
export function pickFrames(pts: DayPoint[], max = 5): DayPoint[] {
  if (pts.length <= max) return pts;
  const idx = new Set<number>([0, pts.length - 1]);
  let lowI = 0;
  pts.forEach((p, i) => {
    if ((scoreOf(p.scan, "overall") ?? 101) < (scoreOf(pts[lowI].scan, "overall") ?? 101)) lowI = i;
  });
  idx.add(lowI);
  for (let k = 1; idx.size < max && k < max; k++) idx.add(Math.round((k * (pts.length - 1)) / (max - 1)));
  for (let i = 0; idx.size < max && i < pts.length; i++) idx.add(i);
  return [...idx].sort((a, b) => a - b).map((i) => pts[i]);
}

export function buildFrames(pts: DayPoint[]): Frame[] {
  return pickFrames(pts).map((p) => ({
    scan: p,
    date: fmtDay(p.day),
    place: p.scan.location?.city ?? null,
    photo: photoOf(p.scan),
    overall: scoreOf(p.scan, "overall"),
    tiles: tilesFor(p, pts),
    conditions: conditionsFor(p),
    note: p.scan.annotation?.note ? `“${p.scan.annotation.note}”` : null,
  }));
}

/** A scripted answer about one scan: what it measured against usual, and what was going on that day. */
export function dayScript(p: DayPoint, pts: DayPoint[], noun: string): LumiScript {
  const tiles = tilesFor(p, pts).filter((t) => t.v != null);
  const low = tiles.filter((t) => t.tone === "alert").map((t) => `${t.label.toLowerCase()} ${t.v} (${t.d} on your usual)`);
  const cond = conditionsFor(p)
    .filter((c) => c.alert)
    .map((c) => c.t.toLowerCase());
  const where = p.scan.location?.city;
  return {
    question: `Why did my ${noun} dip on ${fmtDay(p.day)}?`,
    title: `Your ${noun} on ${fmtDay(p.day)}`,
    sub: [where, `overall ${scoreOf(p.scan, "overall") ?? "–"}`].filter(Boolean).join(" · "),
    paras: [
      low.length ? `That scan was below your usual on ${low.join(", ")}.` : `That scan was close to your usual on most measures.`,
      cond.length
        ? `It was a hard day for skin: ${cond.join(", ")}${where ? ` in ${where}` : ""}.`
        : where
          ? `You were in ${where} that day.`
          : `Nothing unusual was logged that day.`,
      p.scan.annotation?.note ? `You noted: “${p.scan.annotation.note}”` : "",
      `One scan is one moment. The trend across your scans says more than any single day.`,
    ].filter(Boolean),
    stats: tiles.slice(0, 3).map((t) => ({ v: String(t.v), l: t.label.toLowerCase() })),
  };
}

export function buildArea(report: SkinReport, slug: string): AreaDetail | undefined {
  const summary = buildSummary(report);
  const { story } = summary;
  const area = findArea(story.areas, slug);
  if (!area) return undefined;
  const info = areaInfo(area);
  const pts = areaPoints(story, area);
  // The page's own window: this area's first scan to its latest (the whole period when it has only one scan).
  const start = pts.length > 1 ? pts[0].day : summary.period.start;
  const end = pts.length > 1 ? pts[pts.length - 1].day : summary.period.end;
  const last = pts[pts.length - 1];
  const firstPt = pts[0];
  const score = scoreOf(last.scan, "overall");
  const firstScore = scoreOf(firstPt.scan, "overall");
  const delta = pts.length >= 3 && score != null && firstScore != null ? score - firstScore : null;

  const span = Math.max(1, dayNumber(end) - dayNumber(start));
  const fx = (day: string) => Math.max(0, Math.min(1, (dayNumber(day) - dayNumber(start)) / span));
  const series = Object.fromEntries(
    METRICS.map((m) => [m, pts.filter((p) => scoreOf(p.scan, m) != null).map((p) => ({ f: fx(p.day), v: scoreOf(p.scan, m)!, day: p.day }))]),
  ) as Record<MetricKey, SeriesPoint[]>;

  const fromConcern = report.person.concerns.some((c) => leadMetric([c]) === leadMetric(report.person.concerns));
  const lead = fromConcern ? leadMetric(report.person.concerns) : (biggestMove(pts) ?? "redness");
  const leadVals = valuesOf(pts, lead);
  const lFirst = leadVals[0] ?? null;
  const lLast = leadVals[leadVals.length - 1] ?? null;
  // Hydration, texture, tone, oil; redness takes the lead's place when something else leads.
  const others = (["hydration", "evenness", "pigmentation", "oiliness"] as MetricKey[]).map((m) => (m === lead ? "redness" : m));
  const rows: MetricRow[] = others.map((m) => {
    const vs = valuesOf(pts, m);
    const a = vs[0] ?? null;
    const b = vs[vs.length - 1] ?? null;
    const word =
      vs.length < 2 ? (vs.length ? "one scan so far" : "Not measured") : vs.length < pts.length ? `${vs.length} of ${pts.length} scans` : moveWord(m, a, b);
    return { metric: m, label: METRIC_COPY[m].label, first: a, last: b, word };
  });

  const shades: AreaDetail["shades"] = [
    ...trips(story.scans)
      .filter((t) => t.to >= start && t.from <= end)
      .map((t) => ({ f0: fx(t.from), f1: Math.min(1, fx(t.to) + 1 / span), kind: "trip" as const })),
    ...story.events
      .filter((e) => e.kind === "cycle" && e.day >= start && e.day <= end)
      .map((e) => ({ f0: fx(e.day), f1: Math.min(1, fx(e.day) + 1 / span), kind: "cycle" as const })),
  ];
  const mid = new Date((dayNumber(start) + Math.floor(span / 2)) * 864e5).toISOString().slice(0, 10);

  // Subhead: how often it's scanned, then its story in one line.
  const perWeek = pts.length / Math.max(1, (dayNumber(end) - dayNumber(start) + 1) / 7);
  const freq =
    pts.length === 1
      ? "One scan so far."
      : perWeek >= 4
        ? "You scan this one daily."
        : area === story.primaryArea
          ? "Your most-scanned area."
          : perWeek >= 1.5
            ? "You scan this one a few times a week."
            : "You scan this one now and then.";
  const trip = trips(story.scans).find((t) => pts.some((p) => p.day >= t.from && p.day <= t.to));
  const bests =
    pts.length >= 4
      ? METRICS.filter((m) => {
          const vs = valuesOf(pts, m);
          return vs.length && vs[vs.length - 1] >= Math.max(...vs);
        })
      : [];
  const moved = (m: MetricKey) => (valuesOf(pts, m).at(-1) ?? 0) - (valuesOf(pts, m)[0] ?? 0);
  const ups = METRICS.filter((m) => moved(m) >= 3)
    .sort((x, y) => moved(y) - moved(x))
    .slice(0, 2);
  const dip = findDips(story).find((d) => !d.explained && d.areas.includes(area));
  const steadyRed = summary.findings.some((f) => f.kind === "steady" && f.metric === "redness");
  const worst = METRICS.map((m) => ({ m, d: moved(m) })).sort((x, y) => x.d - y.d)[0];
  let tail = "";
  if (trip && bests.length) {
    const g = pts.filter((p) => p.day >= trip.from && p.day <= trip.to);
    const home = pts.filter((p) => p.day < trip.from || p.day > trip.to);
    const worse = METRICS.filter(
      (m) => valuesOf(g, m).length && valuesOf(g, m).reduce((x, y) => x + y, 0) / valuesOf(g, m).length - median(valuesOf(home, m)) <= -6,
    ).slice(0, 2);
    const dry = trip.points.every((p) => (p.scan.location?.environment.humidityPct ?? 100) < 30);
    tail = `${cap(worse.map((m) => METRIC_MOVE[m].worse).join(" and ") || "Rough")} ${dry ? "on the trip" : `in ${trip.city}`}, then the ${METRIC_MOVE[bests.includes(lead) ? lead : bests[0]].best} it’s been all month.`;
  } else if (dip && ups.length) {
    tail = `One ${METRIC_MOVE[dip.metric].worse} week in ${partOfMonth(dip.points[Math.floor(dip.points.length / 2)].day)}, then ${listJoin(ups.map((m) => METRIC_MOVE[m].up))} than in ${monthName(firstPt.day)}.`;
  } else if (pts.length >= 3 && steadyRed && worst && worst.d <= -5) {
    const look: Record<MetricKey, string> = {
      pigmentation: "dark spots look more visible",
      hydration: "it looks drier",
      evenness: "texture looks rougher",
      oiliness: "there’s more shine",
      redness: "it looks redder",
    };
    tail = `Redness stayed calm; ${look[worst.m]} since ${partOfMonth(firstPt.day)}.`;
  } else if (pts.length >= 3 && delta != null && delta >= 3) {
    tail = `Up ${delta} since ${fmtDay(firstPt.day)}, and ${bests.length ? `the ${METRIC_MOVE[bests[0]].best} it’s been` : "holding there"}.`;
  } else if (pts.length >= 3 && delta != null && delta <= -3 && worst) {
    tail = `${cap(METRIC_MOVE[worst.m].short)} has slipped since ${fmtDay(firstPt.day)}; the rest is close to usual.`;
  } else if (pts.length < 3) {
    tail = `A couple more scans and we can show its trend.`;
  } else {
    tail = "Close to its usual all month.";
  }

  const findings = summary.findings.filter((f) => f.areas.includes(area) || (f.area === "" && area === story.primaryArea));

  // Ask Lumi: this area's findings, plus "why did it dip on <its lowest day>?".
  const low =
    pts.length >= 3 ? pts.reduce((lo, p) => ((scoreOf(p.scan, "overall") ?? 101) < (scoreOf(lo.scan, "overall") ?? 101) ? p : lo), pts[0]) : undefined;
  const questions: AreaDetail["questions"] = [];
  if (low && low !== last) questions.push({ q: `Why did my ${info.noun} dip on ${fmtDay(low.day)}?`, script: dayScript(low, pts, info.noun) });
  for (const f of findings)
    if (questions.length < 3 && !questions.some((q) => q.q === f.lumi.question)) questions.push({ q: f.lumi.question, findingId: f.id, script: f.lumi });

  // Recommendations: only what the data supports.
  const recs: Rec[] = [];
  const swap = findSwap(story, report.products ?? []);
  if (swap && area === story.primaryArea) {
    const after = valuesOf(
      pts.filter((p) => p.day >= swap.next.startDate),
      swap.metric,
    );
    const avgAfter = Math.round(after.reduce((a, b) => a + b, 0) / Math.max(1, after.length));
    recs.push({
      id: swap.next.id,
      status: "Keep going",
      tone: "good",
      eyebrow: swap.next.category.toUpperCase(),
      name: swap.next.name,
      body: `Your ${info.noun} has averaged ${avgAfter} since you started it. Two more weeks will tell us more.`,
      image: productImage(swap.next),
    });
  }
  for (const p of report.products ?? []) {
    if (p.endDate || recs.some((r) => r.id === p.id) || p.startDate > (pts[0]?.day ?? "")) continue;
    // A product is judged on the measure it's for (a moisturizer on hydration), else on what improved most.
    const aim: MetricKey | undefined = /moistur|cream|balm/i.test(`${p.category} ${p.name}`)
      ? "hydration"
      : /spf|sunscreen/i.test(`${p.category} ${p.name}`)
        ? "pigmentation"
        : undefined;
    const moves = METRICS.map((m) => ({ m, a: valuesOf(pts, m)[0], b: valuesOf(pts, m).at(-1) })).filter((x) => x.a != null && x.b != null && x.b - x.a >= 5);
    const best = moves.find((x) => x.m === aim) ?? moves.sort((x, y) => y.b! - y.a! - (x.b! - x.a!))[0];
    if (best && pts.length >= 3) {
      recs.push({
        id: p.id,
        status: "Keep",
        tone: "good",
        eyebrow: p.category.toUpperCase(),
        name: p.name,
        body: `${METRIC_COPY[best.m].label} rose ${best.a} → ${best.b} on your ${info.noun} since ${fmtDay(p.startDate)}.`,
        image: productImage(p),
      });
    }
  }
  const slipped = rows
    .concat({ metric: lead, label: METRIC_COPY[lead].label, first: lFirst, last: lLast, word: "" })
    .filter((r) => r.first != null && r.last != null && r.last - r.first <= -5 && pts.length >= 3)
    .sort((a, b) => a.last! - a.first! - (b.last! - b.first!))[0];
  if (slipped) {
    const idea: Record<MetricKey, { eyebrow: string; name: string; tail: string }> = {
      oiliness: { eyebrow: "OIL-FREE", name: "A lightweight gel moisturizer", tail: "A lighter texture at night may help with shine." },
      hydration: { eyebrow: "BARRIER", name: "A ceramide moisturizer", tail: "A richer cream at night may help your skin hold water." },
      pigmentation: { eyebrow: "DAILY SPF", name: "A broad-spectrum SPF 30+", tail: "Daily sunscreen helps keep spots from darkening." },
      redness: { eyebrow: "FRAGRANCE-FREE", name: "A gentle, fragrance-free cleanser", tail: "Fewer irritants can help your skin settle." },
      evenness: { eyebrow: "GENTLE", name: "A simple, gentle routine", tail: "Steady moisture usually helps texture more than scrubbing." },
    };
    const i = idea[slipped.metric];
    recs.push({
      id: `idea-${slipped.metric}`,
      status: "Worth a try",
      tone: "watch",
      eyebrow: i.eyebrow,
      name: i.name,
      body: `${slipped.label} slipped ${slipped.first} → ${slipped.last}. ${i.tail}`,
      image: null,
    });
  }

  const lUp = lFirst != null && lLast != null && pts.length >= 2 ? lLast > lFirst : null;
  return {
    summary,
    area,
    info,
    points: pts,
    countLine: `${pts.length} scan${pts.length === 1 ? "" : "s"} · ${fmtRange(start, end)}`,
    score,
    delta,
    since: `since ${fmtDay(firstPt.day)}`,
    subhead: `${freq} ${tail}`,
    lead: {
      metric: lead,
      title: METRIC_COPY[lead].label,
      sub: fromConcern ? leadSub(report.person.concerns, lead) : "The biggest change on this area, so it leads.",
      latest: lLast,
      first: lFirst,
      word: moveWord(lead, lFirst, lLast),
      up: lUp,
    },
    series,
    others,
    rows,
    shades,
    axis: [fmtDay(start), fmtDay(mid), fmtDay(end)],
    trustNote: `Built from ${pts.length === 1 ? "one scan" : `${pts.length} scans`} of your ${area.toLowerCase()}${summary.trustNote.includes("alongside") ? `, alongside your ${summary.trustNote.split("alongside your ")[1].split(".")[0]}` : ""}. Compared with its own usual. These are patterns, not a diagnosis.`,
    findings,
    frames: buildFrames(pts),
    questions,
    recs,
  };
}

export { plainName };
