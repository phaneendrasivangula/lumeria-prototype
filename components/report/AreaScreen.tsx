"use client";

import { useMemo, useState } from "react";
import { areaInfo } from "@/lib/areas";
import { cap, listJoin } from "@/lib/format";
import type { SkinReport } from "@/lib/types";
import { buildArea } from "@/lib/story/area";
import { buildDial } from "@/lib/story/dial";
import { areaHref } from "@/lib/story/summary";
import { useReport } from "@/lib/useReport";
import { LeadCard, MetricsCard } from "./AreaCharts";
import { AreaHero, AskLumi, LatestScanNote, Recommendations } from "./AreaParts";
import { Findings } from "./Findings";
import { ReportSheets, type SheetState } from "./ReportSheets";
import { Screen } from "./Screen";
import { ErrorState, LoadingState, NotFoundState } from "./States";
import { TimeLapse } from "./TimeLapse";
import { AreaBar } from "./TitleBar";
import { SectionHead, TrustNote } from "./ui";

/** /report/:id/area/:area — one area in detail: its trend, its measures, its patterns, its photos. */
export function AreaScreen({ id, slug, fail }: { id: string; slug: string; fail: boolean }) {
  const { state, retry } = useReport(id, fail);
  const back = `/report/${encodeURIComponent(id)}`;
  if (state.status === "ready") return <Area id={id} slug={slug} report={state.report} />;
  const guess = cap(slug.replace(/-/g, " "));
  return (
    <Screen header={<AreaBar backHref={back} title={guess} onAreas={() => {}} />} tabs={{ id, active: "report" }}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {state.status === "not-found" && <NotFoundState />}
    </Screen>
  );
}

function Area({ id, slug, report }: { id: string; slug: string; report: SkinReport }) {
  const detail = useMemo(() => buildArea(report, slug), [report, slug]);
  const [sheet, setSheet] = useState<SheetState>(null);
  const back = `/report/${encodeURIComponent(id)}`;
  const dial = useMemo(
    () => (detail ? buildDial(report, detail.summary.story, detail.summary.period.start, detail.summary.period.end, detail.summary.dialMetric) : null),
    [report, detail],
  );
  if (!detail || !dial) {
    return (
      <Screen header={<AreaBar backHref={back} title="Area" onAreas={() => {}} />} tabs={{ id, active: "report" }}>
        <NotFoundState what="area" />
      </Screen>
    );
  }
  const { summary } = detail;
  const story = summary.story;
  const progressHref = areaHref(id, story.primaryArea);
  const othersTitle = cap(
    listJoin(detail.others.map((m) => ({ hydration: "hydration", evenness: "texture", pigmentation: "tone", oiliness: "oil", redness: "redness" })[m])),
  );
  const extraTopics = detail.questions.filter((q) => !q.findingId).map((q) => ({ script: q.script }));
  const intro = {
    script: {
      question: `What should I know about my ${detail.info.noun}?`,
      title: `Your ${detail.area.toLowerCase()}`,
      sub: detail.countLine,
      paras: [
        detail.subhead,
        detail.score != null
          ? `Its latest overall score is ${detail.score}${detail.delta != null ? `, ${detail.delta >= 0 ? "up" : "down"} ${Math.abs(detail.delta)} ${detail.since}` : ""}.`
          : "",
        "Ask about a day, a change or a measure, and I’ll show you what your scans say.",
      ].filter(Boolean),
      stats: [],
    },
  };

  return (
    <Screen header={<AreaBar backHref={back} title={detail.area} onAreas={() => setSheet({ kind: "areas" })} />} tabs={{ id, active: "report", progressHref }}>
      <AreaHero detail={detail} />

      <section aria-labelledby="lead-title">
        <SectionHead id="lead-title" title={detail.lead.title} sub={detail.lead.sub} />
        <LeadCard detail={detail} />
        <TrustNote>{detail.trustNote}</TrustNote>
      </section>

      <section aria-labelledby="metrics-title">
        <SectionHead id="metrics-title" title={othersTitle} />
        <MetricsCard detail={detail} />
      </section>

      <section aria-labelledby="noticed-title">
        <SectionHead id="noticed-title" title="What we noticed" />
        {detail.findings.length ? (
          <Findings
            findings={detail.findings}
            variant="area"
            onExplain={(f) => setSheet({ kind: "lumi", topic: { script: f.lumi, findingId: f.id } })}
            onShowData={(f) => setSheet({ kind: "evidence", id: f.id })}
          />
        ) : (
          <LatestScanNote detail={detail} />
        )}
      </section>

      <section aria-labelledby="photos-title">
        <SectionHead id="photos-title" title="Your photos" />
        <TimeLapse frames={detail.frames} area={detail.area} onInfo={() => setSheet({ kind: "guide" })} />
      </section>

      <section aria-labelledby="lumi-title">
        <SectionHead id="lumi-title" title="Ask Lumi" />
        <AskLumi
          questions={detail.questions}
          area={detail.area}
          onAsk={(q) => setSheet({ kind: "lumi", topic: { script: q.script, findingId: q.findingId } })}
          onOpen={() => setSheet({ kind: "lumi", topic: intro })}
        />
      </section>

      {detail.recs.length > 0 && (
        <section aria-labelledby="recs-title">
          <SectionHead id="recs-title" title="Recommendations" />
          <Recommendations recs={detail.recs} />
        </section>
      )}

      <ReportSheets
        sheet={sheet}
        setSheet={setSheet}
        summary={summary}
        dial={dial}
        area={detail.area}
        extraTopics={extraTopics}
        areaLinks={story.areas.map((a) => ({ area: a, href: areaHref(id, a), glyph: areaInfo(a).glyph, current: a === detail.area }))}
      />
    </Screen>
  );
}
