import type { MetricKey, Scan } from "../types";

// The shapes the story engine produces. See ./index.ts for how the pieces fit.

export interface DayPoint {
  scan: Scan;
  day: string; // yyyy-mm-dd, local
}

export type EventKind = "product-start" | "product-stop" | "trip" | "cycle" | "note";

export interface StoryEvent {
  kind: EventKind;
  day: string;
  endDay?: string;
  title: string;
  detail?: string;
}

export interface Insight {
  id: string;
  kind: "trip" | "product" | "sleep" | "stress" | "dip";
  title: string;
  body: string;
  metric: MetricKey;
  /** Average score in the comparison group vs the rest. */
  a: { label: string; value: number; n: number };
  b: { label: string; value: number; n: number };
  strength: "Clear pattern" | "Worth watching";
  evidence: string[];
  caveat?: string;
}

export interface Story {
  scans: DayPoint[]; // sorted oldest → newest
  latest: DayPoint;
  primaryArea: string;
  areas: string[];
  primary: DayPoint[]; // scans of the primary area only, so the trend line compares like with like
  start: string;
  end: string;
  startScore: number;
  endScore: number;
  low: DayPoint;
  best: DayPoint;
  shape: "rough-then-best" | "improving" | "declining" | "steady" | "first";
  headline: string;
  subhead: string;
  events: StoryEvent[];
  insights: Insight[];
  scanDays: number;
  weeksActive: number;
  weeksInPeriod: number;
  personalBests: MetricKey[];
}

// ---- The presentation layer: what the report screens say, built from a Story (see findings.ts, summary.ts, area.ts). ----

/** How sure a finding is. Patterns are never diagnoses. */
export type Confidence = "Likely" | "Possible" | "Can’t separate yet" | "Clear trend" | "Worth watching" | "Missing data";
export type Tone = "good" | "watch" | "alert" | "neutral";

export interface Cause {
  kind: "product" | "trip" | "sleep" | "stress" | "time" | "area";
  name: string;
  when: string;
}

export interface CompareGroup {
  label: string;
  values: number[];
  tone: "alert" | "neutral" | "good";
}

export interface LumiScript {
  question: string;
  title: string;
  sub: string;
  paras: string[];
  stats: { v: string; l: string }[];
}

export interface Finding {
  id: string;
  kind: "swap" | "confound" | "trip" | "sleep" | "stress" | "dip" | "trend" | "steady" | "missing";
  confidence: Confidence | null;
  tone: Tone;
  title: string;
  body: string;
  /** The area the numbers come from, and every area the finding talks about. */
  area: string;
  areas: string[];
  metric: MetricKey | null;
  /** Evidence ("Show data"). */
  sub: string;
  causes: Cause[];
  windows: { from: string; to: string; tone: "watch" | "alert" | "good" }[];
  focus?: DayPoint;
  groups?: { title: string; a: CompareGroup; b: CompareGroup };
  photos: DayPoint[];
  why: { title: string; body: string };
  next?: { title: string; body: string };
  cta?: string;
  lumi: LumiScript;
}

/** A stretch where one measure fell well below that area's usual, across one or more areas. */
export interface Dip {
  metric: MetricKey;
  from: string;
  to: string;
  points: DayPoint[];
  min: number;
  max: number;
  areas: string[];
  explained: boolean;
}
