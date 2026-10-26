// The story engine: raw report in, the month's story out. Pure functions, no React, no fetching.
//   story.ts     orders scans, picks the main area, finds the shape of the month, writes the headline
//   events.ts    routine changes, trips and cycle starts, for the timeline
//   patterns.ts  comparisons with an honest strength ("Clear pattern" / "Worth watching")
export { buildStory } from "./story";
export { buildEvents, shortName, trips } from "./events";
export { buildInsights } from "./patterns";
export type { DayPoint, EventKind, Insight, Story, StoryEvent } from "./types";
