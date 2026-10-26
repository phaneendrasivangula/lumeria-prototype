import type { MetricKey, Product, SkinReport } from "../types";
import { areaInfo, areaSlug } from "../areas";
import { type Band, bandOf } from "../bands";
import {
  METRICS,
  METRIC_COPY,
  METRIC_MOVE,
  METRIC_STEADY,
  addDays,
  cap,
  dayNumber,
  fmtDay,
  fmtRange,
  listJoin,
  mean,
  monthName,
  numberWord,
  partOfMonth,
  scoreOf,
} from "../format";
import { trips } from "./events";
import { areaPoints, buildFindings, buildTrend, findDips, findSwap, plainName, valuesOf } from "./findings";
import { buildStory } from "./story";
import type { DayPoint, Finding, LumiScript, Story, Tone } from "./types";

// The Summary screen, top to bottom, as data. Nothing here knows who the person is.

export interface AreaCard {
  area: string;
  slug: string;
  image: string;
  glyph: ReturnType<typeof areaInfo>["glyph"];
  score: number | null;
  delta: number | null; // null when there are too few scans for a trend
  scans: number;
  /** Overall score per scan, positioned on the period (0–1) for the sparkline. */
  spark: { f: number; v: number }[];
  hue: "sage" | "bronze" | "plum" | "stone";
}

export interface TimelineItem {
  day: string;
  label: string; // "Sep 23", "Oct 3–7"
  title: string;
  detail: string;
  dot: "forest" | "stone" | "clay" | "plum";
}

export interface RoutineItem {
  id: string;
  name: string;
  detail: string;
  status: "Keep" | "Stopped" | "Too early";
  tone: Tone;
  image: string;
  /** What Lumi says when the row is tapped: the main area's scores before and while it was in use. */
  script: LumiScript;
}

export interface Suggestion {
  id: string;
  icon: "science" | "scan" | "note" | "person" | "description";
  title: string;
  body: string;
  cta: string;
  /** Opens the evidence for this finding instead of a toast, when there is one. */
  findingId?: string;
}

export interface Summary {
  story: Story;
  /** What the dial colours each scan by (see dial.ts). */
  dialMetric: MetricKey;
  first: boolean;
  title: string;
  name: string;
  period: { start: string; end: string; label: string };
  welcomeBack?: { title: string; body: string; cta: string };
  score: number | null;
  delta: number | null;
  since: string;
  headline: [string, string];
  subhead: string;
  top?: Finding;
  findings: Finding[];
  patterns: Finding[];
  patternsTitle: string;
  areas: AreaCard[];
  timeline: TimelineItem[];
  routine: RoutineItem[];
  routineRange: string;
  suggestions: Suggestion[];
  trustNote: string;
}

const HUES: AreaCard["hue"][] = ["sage", "bronze", "plum"];

/** Where a moment sits on the period, 0 at the start, 1 at the end of the last day. */
export function periodFraction(start: string, end: string, day: string, hour = 12): number {
  const span = dayNumber(end) - dayNumber(start) + 1;
  return Math.max(0, Math.min(1, (dayNumber(day) - dayNumber(start) + hour / 24) / span));
}

export function productImage(p: Product): string {
  const c = `${p.category} ${p.name}`.toLowerCase();
  if (/serum|oil|drop/.test(c)) return "/products/serum.png";
  if (/gel|treatment|tube|spf|sunscreen|cleanser/.test(c)) return "/products/tube.png";
  return "/products/jar.png";
}

const usagePretty = (u: string) =>
  u
    .replace(/(\d)x\b/g, "$1×")
    .replace(/^PM, daily$/i, "Nightly")
    .replace(/^AM, daily$/i, "Every morning");

/** A product in plain numbers: the main area's overall score before it and while it was in use. No verdicts. */
export function productScript(p: Product, story: Story, status: RoutineItem["status"]): LumiScript {
  const noun = areaInfo(story.primaryArea).noun;
  const using = story.primary.filter((x) => x.day >= p.startDate && (!p.endDate || x.day <= p.endDate));
  const before = story.primary.filter((x) => x.day < p.startDate);
  const a = Math.round(mean(valuesOf(using, "overall")));
  const b = Math.round(mean(valuesOf(before, "overall")));
  const days = dayNumber(p.endDate ?? story.end) - dayNumber(p.startDate) + 1;
  const name = plainName(p);
  return {
    question: `How is ${name} working for me?`,
    title: p.name,
    sub: p.endDate ? `${fmtRange(p.startDate, p.endDate)} · ${usagePretty(p.usage)}` : `Since ${fmtDay(p.startDate)} · ${usagePretty(p.usage)}`,
    paras: [
      `You started ${name} on ${fmtDay(p.startDate)}${p.endDate ? ` and stopped on ${fmtDay(p.endDate)}${p.stoppedReason ? ` (${p.stoppedReason.toLowerCase()})` : ""}` : ""}.`,
      using.length >= 2 && before.length >= 2
        ? `While you used it, your ${noun} averaged ${a} overall, against ${b} before.`
        : using.length >= 2
          ? `Your ${noun} averaged ${a} overall while you used it.`
          : `There aren’t enough ${noun} scans from that time to say much yet.`,
      status === "Too early"
        ? `It’s only been ${days} days. Two to four weeks is a fairer test, so keep scanning.`
        : status === "Stopped"
          ? `Other things changed at the same time too, so these numbers show what happened, not what caused it.`
          : `Nothing in your scans points to changing it.`,
    ],
    stats: [
      ...(before.length >= 2 ? [{ v: String(b), l: "before" }] : []),
      ...(using.length >= 2 ? [{ v: String(a), l: p.endDate ? "while using" : "since" }] : []),
      { v: String(using.length), l: "scans" },
    ],
  };
}

function routineItems(products: Product[], end: string, story: Story): RoutineItem[] {
  return products.map((p) => {
    const stopped = !!p.endDate && p.endDate <= end;
    const early = !stopped && dayNumber(end) - dayNumber(p.startDate) < 14;
    const status: RoutineItem["status"] = stopped ? "Stopped" : early ? "Too early" : "Keep";
    const usage = usagePretty(p.usage);
    const detail = stopped
      ? usage.replace(/^PM,\s*/i, "")
      : early
        ? `${usage} · since ${fmtDay(p.startDate)}`
        : `${p.keyIngredients[0] ?? p.category} · ${usage}`;
    return {
      id: p.id,
      name: p.name,
      detail,
      status,
      tone: stopped ? "alert" : early ? "watch" : "good",
      image: productImage(p),
      script: productScript(p, story, status),
    };
  });
}

const midDay = (a: string, b: string) => addDays(a, Math.floor((dayNumber(b) - dayNumber(a)) / 2));

/** "Barrier repair moisturizer", "Azelaic acid 10%": a product as it reads mid-sentence. */
function timelineName(p: Product): string {
  const n = p.name.replace(/\s+(Night Serum|Serum|Gel|Cream)$/i, "");
  return n.charAt(0) + n.slice(1).toLowerCase();
}

function startedPhrase(p: Product): string {
  const u = usagePretty(p.usage).replace(/^PM, /, "");
  return /^nightly$/i.test(u) ? "Started nightly" : `Started · ${u}`;
}

function headlineFor(story: Story, findings: Finding[]): [string, string] {
  const dip = findings.find((f) => f.kind === "dip");
  switch (story.shape) {
    case "rough-then-best":
      return ["A rough start,", "a calm finish."];
    case "improving":
      return dip ? ["Steady progress,", "one rough week."] : ["Steady progress,", "and it held."];
    case "declining": {
      const steady = findings.find((f) => f.kind === "steady");
      const worst = decliningMetric(story);
      if (steady?.metric && worst) return [`${METRIC_STEADY[steady.metric]} skin,`, `${METRIC_MOVE[worst].short} to watch.`];
      return ["A tougher stretch,", "with a way back."];
    }
    case "first":
      return ["Your starting point.", "Welcome."];
    default:
      return ["A steady stretch,", "close to your usual."];
  }
}

/** The measure that fell most on the main area, first scan to last. */
function decliningMetric(story: Story): MetricKey | undefined {
  const pts = story.primary;
  const moves = METRICS.map((m) => {
    const vs = valuesOf(pts, m);
    return { m, d: vs.length >= 2 ? vs[vs.length - 1] - vs[0] : 0 };
  }).sort((a, b) => a.d - b.d);
  return moves[0] && moves[0].d <= -5 ? moves[0].m : undefined;
}

function subheadFor(report: SkinReport, story: Story, findings: Finding[]): string {
  const t = trips(story.scans)[0];
  const swap = findSwap(story, report.products ?? []);
  const dip = findings.find((f) => f.kind === "dip");
  if (story.shape === "rough-then-best") {
    let words: string[] = [];
    if (t) {
      const g = story.primary.filter((p) => p.day >= t.from && p.day <= t.to);
      const home = story.primary.filter((p) => p.day < t.from || p.day > t.to);
      words = METRICS.filter((m) => mean(valuesOf(g, m)) - mean(valuesOf(home, m)) <= -6)
        .slice(0, 2)
        .map((m) => METRIC_MOVE[m].worse);
    }
    const what = words.length ? listJoin(words) : "rough";
    const where = t ? `during your ${t.city} trip` : `around ${fmtDay(story.low.day)}`;
    const then =
      swap && swap.next.startDate > (t?.to ?? story.low.day)
        ? `then calmed after you switched to ${plainName(swap.next)}`
        : "then bounced back past where it started";
    return `Your skin got ${what} ${where}, ${then}.`;
  }
  if (story.shape === "improving" && dip?.metric) {
    const turned: Record<MetricKey, string> = {
      redness: "turned red",
      hydration: "dried out",
      evenness: "got rougher",
      pigmentation: "looked less even",
      oiliness: "got shinier",
    };
    const who =
      dip.areas.length === 2
        ? `Your ${areaInfo(dip.areas[0]).noun} and ${areaInfo(dip.areas[1]).noun} both`
        : dip.areas.length > 2
          ? "All your areas"
          : `Your ${areaInfo(dip.areas[0]).noun}`;
    const days = dip.windows[0] ? dayNumber(dip.windows[0].to) - dayNumber(dip.windows[0].from) + 1 : 7;
    const span = days <= 10 ? "about a week" : `about ${numberWord(Math.round(days / 7))} weeks`;
    return `${who} ${turned[dip.metric]} for ${span} in ${partOfMonth(midDay(dip.windows[0]?.from ?? story.start, dip.windows[0]?.to ?? story.start))}, then calmed and kept improving.`;
  }
  if (story.shape === "improving") return "Most of your scores moved up, and they’ve held there.";
  if (story.shape === "declining") {
    const steady = findings.find((f) => f.kind === "steady");
    const worst = decliningMetric(story);
    if (worst) {
      const fell = story.areas.filter((a) => {
        const vs = valuesOf(areaPoints(story, a), worst);
        return vs.length >= 2 && vs[vs.length - 1] < vs[0];
      });
      const where =
        fell.length === story.areas.length && fell.length > 1 ? `on all ${numberWord(fell.length)} areas` : `on your ${areaInfo(story.primaryArea).noun}`;
      const look: Record<MetricKey, string> = {
        pigmentation: "Dark spots look a little more visible",
        hydration: "Skin looks a little drier",
        evenness: "Texture looks a little rougher",
        oiliness: "There’s a little more shine",
        redness: "Skin looks a little redder",
      };
      const lead = steady?.metric ? `${METRIC_COPY[steady.metric].label} stayed ${steady.metric === "redness" ? "calm" : "steady"} everywhere. ` : "";
      return `${lead}${look[worst]} ${where} than in ${monthName(story.scans[0].day)}.`;
    }
    return "Your scores dipped lately. Here’s what lined up with it, and what to try.";
  }
  if (story.shape === "first") return "Here’s where your skin starts. A few more scans and we can show you how it’s changing.";
  return `${story.scans.length} scans, and your skin stayed close to its usual range.`;
}

function timelineFor(report: SkinReport, story: Story, findings: Finding[], now: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  const products = report.products ?? [];
  const swap = findSwap(story, products);
  for (const p of products) {
    if (p.startDate >= story.start && p.startDate <= story.end) {
      const improved = swap?.next.id === p.id && findings.some((f) => f.kind === "swap" && f.tone === "good");
      items.push({
        day: p.startDate,
        label: fmtDay(p.startDate),
        title: timelineName(p),
        detail: `${startedPhrase(p)}${improved ? ` · ${swap!.metric === "redness" ? "skin calmer since" : "better since"}` : ""}`,
        dot: p.endDate ? "stone" : "forest",
      });
    }
    if (p.endDate && p.endDate <= story.end) {
      items.push({
        day: p.endDate,
        label: fmtDay(p.endDate),
        title: `${plainName(p).replace(/^./, (c) => c.toUpperCase())} stopped`,
        detail: p.stoppedReason ?? "Stopped",
        dot: "clay",
      });
    }
  }
  for (const t of trips(story.scans)) {
    const env = t.points.map((p) => p.scan.location!.environment);
    const words = [
      mean(env.map((e) => e.tempHighC)) >= 30 ? "Hot" : "",
      mean(env.map((e) => e.humidityPct)) < 30 ? "dry" : "",
      Math.max(...env.map((e) => e.uvIndexMax)) >= 8 && mean(env.map((e) => e.tempHighC)) < 30 ? "sunny" : "",
    ].filter(Boolean);
    const drop = findings.find((f) => (f.kind === "confound" || f.kind === "trip") && f.metric);
    items.push({
      day: t.from,
      label: fmtRange(t.from, t.to, "–"),
      title: `${t.city} trip`,
      detail: [words.length ? cap(words.join(" and ")) : "Away from home", drop?.metric ? `${METRIC_COPY[drop.metric].label.toLowerCase()} dipped` : ""]
        .filter(Boolean)
        .join(" · "),
      dot: "clay",
    });
  }
  for (const e of story.events.filter((x) => x.kind === "cycle")) {
    items.push({ day: e.day, label: fmtDay(e.day), title: "Period", detail: e.detail ?? "Cycle day 1", dot: "plum" });
  }
  // With little logged, the month's own milestones tell the story instead.
  if (items.length < 3) {
    const first = story.scans[0];
    items.push({
      day: first.day,
      label: fmtDay(first.day),
      title: "First scan",
      detail: `${first.scan.area} · overall ${scoreOf(first.scan, "overall") ?? "–"}`,
      dot: "forest",
    });
    const seen = new Set([first.scan.area]);
    for (const p of story.scans) {
      if (seen.has(p.scan.area)) continue;
      const same = story.scans.filter((q) => q.day === p.day && !seen.has(q.scan.area));
      same.forEach((q) => seen.add(q.scan.area));
      if (p.day !== first.day && (same.length > 1 || dayNumber(p.day) - dayNumber(first.day) > 7))
        items.push({
          day: p.day,
          label: fmtDay(p.day),
          title: same.length > 1 ? "Two new areas" : "New area",
          detail: listJoin(same.map((q) => q.scan.area)),
          dot: "stone",
        });
    }
    for (const p of story.scans.filter((q) => !q.scan.photoUrl)) {
      items.push({
        day: p.day,
        label: fmtDay(p.day),
        title: `${cap(areaInfo(p.scan.area).noun)} scan, no photo`,
        detail: "Scores saved, the picture wasn’t",
        dot: "clay",
      });
    }
    for (const d of findDips(story)
      .filter((x) => !x.explained)
      .slice(0, 1)) {
      items.push({
        day: d.from,
        label: fmtRange(d.from, d.to, "–"),
        title: "A rough week",
        detail: `${METRIC_COPY[d.metric].label} ${d.min}–${d.max} on ${d.areas.length === story.areas.length && d.areas.length > 1 ? (d.areas.length === 2 ? "both areas" : "every area") : listJoin(d.areas.map((a) => a.toLowerCase()))}`,
        dot: "clay",
      });
    }
    if (story.primary.length >= 4 && (story.shape === "improving" || story.shape === "rough-then-best")) {
      const b = story.best;
      const hyd = scoreOf(b.scan, "hydration");
      items.push({
        day: b.day,
        label: fmtDay(b.day),
        title: `Best ${areaInfo(b.scan.area).noun} scan`,
        detail: `Overall ${scoreOf(b.scan, "overall")}${hyd != null ? ` · hydration ${hyd}` : ""}`,
        dot: "forest",
      });
    }
    const last = story.latest;
    if (last !== first) {
      const weeks = Math.round((dayNumber(now) - dayNumber(last.day)) / 7);
      items.push({
        day: last.day,
        label: fmtDay(last.day),
        title: "Last scan",
        detail: `${weeks >= 2 ? `${cap(areaInfo(last.scan.area).noun)} · ${numberWord(weeks)} weeks ago` : `${last.scan.area} · overall ${scoreOf(last.scan, "overall") ?? "–"}`}`,
        dot: "stone",
      });
    }
  }
  const order = (x: TimelineItem) => x.day + (x.title === "Last scan" ? "z" : "");
  const seen = new Set<string>();
  return items
    .sort((a, b) => order(a).localeCompare(order(b)))
    .filter((x) => {
      const k = `${x.day}|${x.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 7);
}

function suggestionsFor(report: SkinReport, story: Story, findings: Finding[], welcome: boolean, now: string): Suggestion[] {
  const out: Suggestion[] = [];
  const swap = findSwap(story, report.products ?? []);
  const confound = findings.find((f) => f.kind === "confound");
  const nextMonth = monthName(addDays(story.end, 10));
  if (swap && confound) {
    out.push({
      id: "test",
      icon: "science",
      title: `Find out if ${plainName(swap.next)} is what ${swap.metric === "redness" ? "calmed" : "helped"} your skin`,
      body: `Two weeks in ${nextMonth}. Keep ${plainName(swap.next)}, leave ${plainName(swap.stopped)} off and add nothing new. You can stop anytime.`,
      cta: "Start a 2-week test",
      findingId: confound.id,
    });
  }
  if (report.person.skinType == null) {
    out.push({
      id: "skin-type",
      icon: "person",
      title: "Make this report yours",
      body: "We don’t know your skin type or what you’d like to track yet. Two taps and your report will focus on what matters to you.",
      cta: "Add skin type",
    });
  }
  const counts = story.areas.map((a) => ({ a, n: areaPoints(story, a).length }));
  const main = counts[0];
  const thin = counts.slice(1).filter((c) => c.n >= 3 && c.n < main.n / 2);
  const few = counts.slice(1).filter((c) => c.n < 3);
  if (thin.length) {
    const t = thin[0];
    out.push({
      id: "scan-more",
      icon: "scan",
      title: `Scan your ${areaInfo(t.a).noun} twice a week`,
      body: `Your ${areaInfo(t.a).noun} had ${t.n} scans this month. Two a week would give it a clear trend by your next report, like your ${areaInfo(main.a).noun}.`,
      cta: "Set a reminder",
    });
  } else if (few.length) {
    const names = listJoin(few.slice(0, 2).map((c) => areaInfo(c.a).noun));
    out.push({
      id: "scan-more",
      icon: "scan",
      title: `Scan your ${names} more`,
      body: `${few.length > 1 ? "They have" : "It has"} ${few.length > 1 && few.every((c) => c.n === few[0].n) ? `${numberWord(few[0].n)} scans each` : "only a few scans"}. Two a week gives ${few.length > 1 ? "them" : "it"} a real trend by next report.`,
      cta: "Set a reminder",
    });
  } else if (welcome) {
    const n = story.areas.length;
    out.push({
      id: "scan-again",
      icon: "scan",
      title: n === 1 ? `Scan your ${areaInfo(story.areas[0]).noun} this week` : `Scan ${n === 2 ? "both" : "all your"} areas this week`,
      body: `Your ${monthName(now)} report has no scans yet. Two a week per area brings the trend back.`,
      cta: "Set a reminder",
    });
  }
  const dip = findings.find((f) => f.kind === "dip");
  if (dip) {
    out.push({
      id: "note",
      icon: "note",
      title: `Add a note about ${monthName(dip.windows[0]?.from ?? story.start)}`,
      body: "If something changed that week, like travel, a product or stress, a note helps your next report explain it.",
      cta: "Add a note",
    });
  }
  const extras = [
    story.scans.some((p) => p.scan.annotation?.note) ? "notes" : "",
    report.products?.length ? "routine" : "",
    story.scans.some((p) => p.scan.location) ? "conditions" : "",
    story.scans.some((p) => p.scan.checkin) ? "check-ins" : "",
  ].filter(Boolean);
  out.push({
    id: "derm",
    icon: "description",
    title: "Bring it to your dermatologist",
    body: `All ${story.scans.length} scans with five measures each${extras.length ? `, plus your ${listJoin(extras)}` : ""}, in one file. These are patterns, not a diagnosis.`,
    cta: "Export report",
  });
  return out;
}

function trustNoteFor(story: Story): string {
  const s = story.scans;
  const ctx = [
    s.some((p) => p.scan.health) ? "sleep, cycle" : "",
    s.some((p) => p.scan.location) ? "UV, humidity" : "",
    s.some((p) => p.scan.annotation?.note) ? "notes" : "",
    s.some((p) => p.scan.checkin) ? "sleep, water and stress check-ins" : "",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1");
  const of = story.areas.length === 2 ? ` of your ${story.areas.map((a) => a.toLowerCase()).join(" and ")}` : "";
  const n = s.length === 1 ? "your first scan" : `your ${s.length} scans${of}`;
  return `Built from ${n}${ctx ? `, alongside your ${ctx}` : ""}. ${story.areas.length > 1 ? "Each area is compared with its own usual. " : ""}These are patterns, not a diagnosis.`;
}

export function buildSummary(report: SkinReport): Summary {
  const story = buildStory(report);
  const now = report.generatedAt.slice(0, 10);
  const first = story.shape === "first";
  const findings = buildFindings(report, story);
  const swapF = findings.find((f) => f.kind === "swap" && f.tone === "good");
  const trend = swapF ? undefined : buildTrend(story);
  const top = swapF ?? trend;
  const ORDER: Finding["kind"][] = ["confound", "dip", "trip", "steady", "missing", "sleep", "stress", "trend", "swap"];
  const patterns = findings
    .filter((f) => f !== top && f.kind !== "swap")
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .slice(0, 3);

  const latest = story.latest;
  const firstScan = story.scans[0];
  const score = scoreOf(latest.scan, "overall");
  const firstScore = scoreOf(firstScan.scan, "overall");
  const delta = !first && score != null && firstScore != null ? score - firstScore : null;

  const start = first ? story.latest.day : story.start;
  const end = first ? addDays(start, 29) : story.end;

  const gap = dayNumber(now) - dayNumber(latest.day);
  let welcomeBack: Summary["welcomeBack"];
  if (!first && gap >= 14) {
    const weeks = Math.round(gap / 7);
    const noun = areaInfo(latest.scan.area).noun;
    welcomeBack =
      weeks >= 4
        ? {
            title: `Your last scan was ${fmtDay(latest.day)}, ${numberWord(weeks)} weeks ago.`,
            body: `Your ${monthName(now)} report needs a few scans. Here’s where you left off.`,
            cta: "Scan today",
          }
        : {
            title: `${gap} days since your last scan.`,
            body: `Your last one was your ${noun} on ${fmtDay(latest.day)}. A scan today keeps your report up to date.`,
            cta: `Scan your ${noun}`,
          };
  }

  const areas: AreaCard[] = story.areas.map((a, i) => {
    const pts = areaPoints(story, a);
    const info = areaInfo(a);
    const vals = pts.filter((p) => scoreOf(p.scan, "overall") != null);
    const lastV = vals.length ? scoreOf(vals[vals.length - 1].scan, "overall") : null;
    const firstV = vals.length ? scoreOf(vals[0].scan, "overall") : null;
    const enough = vals.length >= 3;
    return {
      area: a,
      slug: info.slug,
      image: info.image,
      glyph: info.glyph,
      score: lastV,
      delta: enough && lastV != null && firstV != null ? lastV - firstV : null,
      scans: pts.length,
      spark: vals.map((p) => ({ f: (dayNumber(p.day) - dayNumber(start)) / Math.max(1, dayNumber(end) - dayNumber(start)), v: scoreOf(p.scan, "overall")! })),
      hue: enough ? HUES[i % HUES.length] : "stone",
    };
  });

  // The dial colours by redness, unless redness was calm on every scan and another measure is the one to watch.
  const dialMetric: MetricKey =
    findings.some((f) => f.kind === "steady" && f.metric === "redness") && top?.kind === "trend" && top.tone === "alert" && top.metric ? top.metric : "redness";

  return {
    story,
    dialMetric,
    first,
    title: "Monthly Report",
    name: report.person.firstName,
    period: { start, end, label: fmtRange(start, end) },
    welcomeBack,
    score,
    delta,
    since: `since ${fmtDay(firstScan.day)}`,
    headline: headlineFor(story, findings),
    subhead: subheadFor(report, story, findings),
    top,
    findings: top && !findings.includes(top) ? [top, ...findings] : findings,
    patterns,
    patternsTitle: "What might be related",
    areas,
    timeline: first ? [] : timelineFor(report, story, findings, now),
    routine: routineItems(report.products ?? [], story.end, story),
    routineRange: `${fmtDay(story.start)} → ${fmtDay(story.end)}`,
    suggestions: first ? [] : suggestionsFor(report, story, findings, !!welcomeBack, now),
    trustNote: trustNoteFor(story),
  };
}

export const areaHref = (id: string, area: string) => `/report/${encodeURIComponent(id)}/area/${areaSlug(area)}`;

export type { Band, DayPoint };
export { bandOf };
