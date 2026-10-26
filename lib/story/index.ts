// The story engine: raw report in, the month's story out. Pure functions, no React, no fetching.
//   story.ts     orders scans, picks the main area, finds the shape of the month, writes the headline
//   events.ts    routine changes, trips and cycle starts, for the timeline
//   patterns.ts  comparisons with an honest strength ("Clear pattern" / "Worth watching")
//   findings.ts  every pattern the screens show, with confidence, evidence and a Lumi script
//   summary.ts   the Summary screen as data; area.ts the area page; dial.ts the dial; series.ts chart data
export { buildStory } from "./story";
export { buildEvents, shortName, trips } from "./events";
export { buildInsights } from "./patterns";
export { buildFindings, buildTrend, findDips, plainName } from "./findings";
export { buildSummary, areaHref } from "./summary";
export { buildArea } from "./area";
export { buildDial } from "./dial";
export { evidenceSeries, metricSeries } from "./series";
export type { DayPoint, EventKind, Finding, Insight, LumiScript, Story, StoryEvent } from "./types";
