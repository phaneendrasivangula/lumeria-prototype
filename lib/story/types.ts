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

