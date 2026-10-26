import { METRIC_MOVE, METRICS, brief, cap, scoreOf } from "../format";
import type { MetricKey } from "../types";
import type { Summary, Suggestion } from "./summary";
import type { Finding, Tone } from "./types";

// "Quick insights": the month in four swipeable cards, built from the same Summary the report shows.
// 1. the month (score then and now, and the measures that moved most), 2–3. the two findings it turns on,
// 4. the one thing to do next. Every number comes from the scans; a first-scan report has no cards.

export type CardAction =
  | { label: string; icon: "flare"; kind: "lumi"; findingId: string }
  | { label: string; icon: "description"; kind: "evidence"; findingId: string }
  | { label: string; icon: "science" | "center_focus_weak" | "edit_note" | "person" | "description"; kind: "suggestion"; suggestionId: string };

export type CardRow =
  | { kind: "bar"; label: string; detail: string; frac: number; tone: "good" | "watch" }
  | { kind: "text"; label: string; value: string; tone?: Tone };

export interface QuickCard {
  id: string;
  tint: "sage" | "deep" | "clay" | "bronze";
  icon: "calendar_month" | "spa" | "join_inner" | "history" | "opacity" | "event_upcoming";
  eyebrow: string;
  title: string;
  value?: string;
  body: string;
  tag?: { label: string; tone: Tone };
  rows: CardRow[];
  actions: CardAction[];
}

const EYEBROW: Partial<Record<Finding["kind"], { text: string; icon: QuickCard["icon"] }>> = {
  swap: { text: "What may have helped", icon: "spa" },
  confound: { text: "What lined up", icon: "join_inner" },
  trip: { text: "What changed", icon: "history" },
  dip: { text: "One rough stretch", icon: "history" },
  sleep: { text: "Worth a look", icon: "opacity" },
  stress: { text: "Worth a look", icon: "opacity" },
  trend: { text: "What we noticed", icon: "spa" },
  steady: { text: "What held steady", icon: "spa" },
  missing: { text: "What’s missing", icon: "opacity" },
};

const SUGGESTION_ICON: Record<Suggestion["icon"], Extract<CardAction, { kind: "suggestion" }>["icon"]> = {
  science: "science",
  scan: "center_focus_weak",
  note: "edit_note",
  person: "person",
  description: "description",
};

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/** The measures that moved most on the main area, first scan to latest: improvements first, then what slipped. */
function movers(summary: Summary): CardRow[] {
  const pts = summary.story.primary;
  if (pts.length < 2) return [];
  const first = pts[0].scan;
  const last = pts[pts.length - 1].scan;
  const moved = METRICS.map((m: MetricKey) => ({ m, a: scoreOf(first, m), b: scoreOf(last, m) }))
    .filter((x): x is { m: MetricKey; a: number; b: number } => x.a != null && x.b != null && x.a !== x.b)
    .sort((x, y) => Number(y.b > y.a) - Number(x.b > x.a) || Math.abs(y.b - y.a) - Math.abs(x.b - x.a))
    .slice(0, 3);
  const top = Math.max(...moved.map((x) => x.b), 1);
  return moved.map((x) => ({
    kind: "bar",
    label: x.b > x.a ? METRIC_MOVE[x.m].adj : cap(METRIC_MOVE[x.m].down),
    detail: `${x.a} → ${x.b}`,
    frac: x.b / top,
    tone: x.b > x.a ? "good" : "watch",
  }));
}

function findingCard(f: Finding, tint: QuickCard["tint"]): QuickCard {
  const head = EYEBROW[f.kind] ?? { text: "What we noticed", icon: "spa" as const };
  const rows: CardRow[] = [];
  if (f.groups) {
    const a = avg(f.groups.a.values);
    const b = avg(f.groups.b.values);
    const top = Math.max(a, b, 1);
    const word = f.metric ? METRIC_MOVE[f.metric].short : "score";
    rows.push({ kind: "bar", label: f.groups.a.label, detail: `${word} ${a}`, frac: a / top, tone: f.groups.a.tone === "alert" ? "watch" : "good" });
    rows.push({ kind: "bar", label: f.groups.b.label, detail: `${word} ${b}`, frac: b / top, tone: f.groups.b.tone === "good" ? "good" : "watch" });
  } else if (f.areas.length > 1) {
    rows.push({ kind: "text", label: "Areas", value: f.areas.join(", ") });
  }
  if (f.confidence) rows.push({ kind: "text", label: "How sure", value: f.confidence === "Likely" ? "Likely, not certain" : f.confidence, tone: f.tone });
  return {
    id: f.id,
    tint,
    icon: head.icon,
    eyebrow: head.text,
    title: f.title,
    body: brief(f.related ?? f.body),
    tag: f.confidence ? { label: f.confidence, tone: f.tone } : undefined,
    rows,
    actions: [
      { label: "Explain", icon: "flare", kind: "lumi", findingId: f.id },
      { label: "Show data", icon: "description", kind: "evidence", findingId: f.id },
    ],
  };
}

export function buildCards(summary: Summary): QuickCard[] {
  if (summary.first || summary.score == null) return [];
  const cards: QuickCard[] = [
    {
      id: "month",
      tint: "sage",
      icon: "calendar_month",
      eyebrow: summary.period.label,
      title: `${summary.headline[0]} ${summary.headline[1]}`.trim(),
      value: summary.delta != null ? `${summary.score - summary.delta} → ${summary.score}` : undefined,
      body: brief(summary.subhead),
      rows: movers(summary),
      actions: [],
    },
  ];
  const seen = new Set<string>();
  const findings = [summary.top, ...summary.patterns].filter((f): f is Finding => !!f && !seen.has(f.id) && !!seen.add(f.id)).slice(0, 2);
  findings.forEach((f) => cards.push(findingCard(f, f.tone === "alert" || f.tone === "watch" ? "clay" : "deep")));
  const next = summary.suggestions[0];
  if (next) {
    cards.push({
      id: `next-${next.id}`,
      tint: "bronze",
      icon: "event_upcoming",
      eyebrow: "Next",
      title: next.title,
      body: brief(next.body),
      rows: [],
      actions: [
        ...(next.findingId ? [{ label: "Show data", icon: "description" as const, kind: "evidence" as const, findingId: next.findingId }] : []),
        { label: next.cta, icon: SUGGESTION_ICON[next.icon], kind: "suggestion", suggestionId: next.id },
      ],
    });
  }
  return cards;
}
