"use client";

import { useMemo, useState } from "react";
import { reportCsv } from "@/lib/exportCsv";
import { METRIC_COPY } from "@/lib/format";
import type { SkinReport } from "@/lib/types";
import { buildCards } from "@/lib/story/cards";
import { buildDial } from "@/lib/story/dial";
import { buildStreak } from "@/lib/story/streak";
import { areaHref, buildSummary, type Suggestion } from "@/lib/story/summary";
import { useReport } from "@/lib/useReport";
import { AreaCards } from "./AreaCards";
import { Dial } from "./Dial";
import { Findings } from "./Findings";
import { FirstScan } from "./FirstScan";
import { Headline, QuickLink, TopInsight, WelcomeBack } from "./Highlights";
import { ReportSheets, type SheetState } from "./ReportSheets";
import { Reveal, RevealLoading } from "./Reveal";
import { Routine } from "./Routine";
import { Screen, useScrolledPast } from "./Screen";
import { EmptyState, ErrorState, LoadingState, NotFoundState } from "./States";
import { StreakCard } from "./StreakCard";
import { Suggestions } from "./Suggestions";
import { Timeline } from "./Timeline";
import { Period, TitleBar } from "./TitleBar";
import { SectionHead, TrustNote, useToast } from "./ui";
import { revealSeen, useRevealPhase } from "./useRevealPhase";
import s from "./SummaryScreen.module.css";

/** /report/:id — the monthly Summary. Fetches like a real client and shows loading, error and not-found states. */
export function SummaryScreen({ id, fail }: { id: string; fail: boolean }) {
  const { state, retry } = useReport(id, fail);
  // On a fresh load the wait happens on the reveal's own evergreen screen, so loading flows straight into the reveal
  // (no summary-shaped skeleton in between). Coming back from an area page, the summary skeleton shows instead.
  const [dusk] = useState(() => !revealSeen(id));
  const empty = state.status === "ready" && !state.report.scans?.length;
  if (state.status === "ready" && !empty) return <Summary id={id} report={state.report} />;
  if (state.status === "loading" && dusk) return <RevealLoading />;
  return (
    <Screen header={<TitleBar title="Monthly Report" />} tabs={{ id, active: "report" }}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {state.status === "not-found" && <NotFoundState />}
      {empty && <EmptyState />}
    </Screen>
  );
}

function Summary({ id, report }: { id: string; report: SkinReport }) {
  const summary = useMemo(() => buildSummary(report), [report]);
  const { story, period } = summary;
  const dial = useMemo(
    () => buildDial(report, story, period.start, period.end, summary.dialMetric),
    [report, story, period.start, period.end, summary.dialMetric],
  );
  const cards = useMemo(() => buildCards(summary), [summary]);
  const [sheet, setSheet] = useState<SheetState>(null);
  // The reveal opens the report once per page load, then hands over to the summary (see useRevealPhase).
  const { phase, leave } = useRevealPhase(id);
  const collapsed = useScrolledPast(230);

  const hrefFor = (area: string) => areaHref(id, area);
  const progressHref = hrefFor(story.primaryArea);

  return (
    <Screen
      header={
        <TitleBar
          title={summary.title}
          mini={summary.first ? undefined : { score: summary.score, delta: summary.delta, since: summary.since, shown: collapsed }}
        />
      }
      tabs={{ id, active: "report", progressHref }}
    >
      {/* remounted when the reveal hands over, so the dial draws itself in again as the summary rises */}
      <div key={phase === "reveal" ? "waiting" : "shown"} className={s.stage} data-phase={phase}>
        <Body id={id} report={report} summary={summary} dial={dial} cards={cards} sheet={sheet} setSheet={setSheet} hrefFor={hrefFor} />
      </div>
      {phase !== "done" && (
        <Reveal summary={summary} leaving={phase === "enter"} onDone={() => leave()} cards={cards.length} onCards={() => leave(() => setSheet({ kind: "cards" }))} />
      )}
    </Screen>
  );
}

function Body({
  id,
  report,
  summary,
  dial,
  cards,
  sheet,
  setSheet,
  hrefFor,
}: {
  id: string;
  report: SkinReport;
  summary: ReturnType<typeof buildSummary>;
  dial: ReturnType<typeof buildDial>;
  cards: ReturnType<typeof buildCards>;
  sheet: SheetState;
  setSheet: (s: SheetState) => void;
  hrefFor: (area: string) => string;
}) {
  const toast = useToast();
  const streak = useMemo(() => buildStreak(summary), [summary]);
  const streakCard = <StreakCard streak={streak} onMore={() => toast("Your streak history is coming to the Lumeria app")} />;
  const { story } = summary;
  const explain = (f: (typeof summary.findings)[number]) => setSheet({ kind: "lumi", topic: { script: f.lumi, findingId: f.id } });
  const showData = (f: (typeof summary.findings)[number]) => setSheet({ kind: "evidence", id: f.id });

  // What each suggestion's button does: the dermatologist export downloads a CSV; the rest live in the app (a toast here).
  const act = (sg: Suggestion) => {
    if (sg.id === "derm") {
      const blob = new Blob([reportCsv(report)], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${id}-skin-report.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Report downloaded");
      return;
    }
    const msg: Record<string, string> = {
      test: "Your 2-week test is set up in the Lumeria app",
      "scan-more": "Reminders are set in the Lumeria app",
      "scan-again": "Reminders are set in the Lumeria app",
      note: "Notes are added in the Lumeria app",
      "skin-type": "You can add your skin type in the Lumeria app",
    };
    toast(msg[sg.id] ?? "Coming soon");
  };
  const sheets = (
    <ReportSheets
      sheet={sheet}
      setSheet={setSheet}
      summary={summary}
      dial={dial}
      area={story.primaryArea}
      cards={cards}
      onSuggestion={(sid) => {
        // the cards' "next step" button runs the same action as the suggestion it came from
        const sg = summary.suggestions.find((x) => x.id === sid);
        if (sg) act(sg);
      }}
    />
  );

  if (summary.first) {
    return (
      <>
        <Period>{summary.period.label}</Period>
        <FirstScan summary={summary} onInfo={() => setSheet({ kind: "guide" })} onPlan={() => toast("Reminders are set in the Lumeria app")} />
        {streakCard}
        {sheets}
      </>
    );
  }

  const dialLabel = `Your ${story.areas.length > 1 ? `${story.areas.length} areas` : story.primaryArea.toLowerCase()} from ${summary.period.label}: one ring per area, one mark per scan, coloured by its ${METRIC_COPY[summary.dialMetric].label.toLowerCase()} score: calm, dipped or rough.`;

  return (
    <>
      <Period>{summary.period.label}</Period>
      {summary.welcomeBack && <WelcomeBack {...summary.welcomeBack} onCta={() => toast("Scanning happens in the Lumeria app")} />}
      <Headline headline={summary.headline} subhead={summary.subhead} />
      <div className={s.dialWrap}>
        <Dial model={dial} score={summary.score} delta={summary.delta} since={summary.since} onInfo={() => setSheet({ kind: "guide" })} label={dialLabel} />
      </div>
      {cards.length > 0 && <QuickLink count={cards.length} onOpen={() => setSheet({ kind: "cards" })} />}
      {summary.top && <TopInsight finding={summary.top} onExplain={() => explain(summary.top!)} onShowData={() => showData(summary.top!)} />}

      <section aria-labelledby="areas-title">
        <SectionHead id="areas-title" title="What changed, by area" />
        <AreaCards cards={summary.areas} hrefFor={hrefFor} />
      </section>

      {summary.patterns.length > 0 && (
        <section aria-labelledby="patterns-title">
          <SectionHead id="patterns-title" title={summary.patternsTitle} />
          <Findings findings={summary.patterns} variant="summary" onExplain={explain} onShowData={showData} />
        </section>
      )}
      <TrustNote>{summary.trustNote}</TrustNote>

      {summary.timeline.length > 0 && (
        <section aria-labelledby="events-title">
          <SectionHead id="events-title" title="What happened" />
          <Timeline items={summary.timeline} />
        </section>
      )}

      <section aria-labelledby="routine-title" id="routine" className={s.anchor}>
        <SectionHead id="routine-title" title="Your routine" />
        <Routine
          items={summary.routine}
          onAdd={() => toast("You can add products in the Lumeria app")}
          onOpen={(r) => setSheet({ kind: "lumi", topic: { script: r.script } })}
        />
      </section>

      {streakCard}

      {summary.suggestions.length > 0 && (
        <section aria-labelledby="suggestions-title">
          <SectionHead id="suggestions-title" title="Suggestions" />
          <Suggestions items={summary.suggestions} onAct={act} />
        </section>
      )}
      {sheets}
    </>
  );
}
