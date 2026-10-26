"use client";

import { useMemo, useState } from "react";
import type { SkinReport } from "@/lib/types";
import { buildStory } from "@/lib/story";
import { fmtDay } from "@/lib/format";
import { useReport } from "@/lib/useReport";
import { Areas } from "./Areas";
import { Dial } from "./Dial";
import { FirstScan } from "./FirstScan";
import { GuideSheet } from "./GuideSheet";
import { Patterns } from "./Patterns";
import { Routine } from "./Routine";
import { ScanSheet } from "./ScanSheet";
import { ScanStrip } from "./ScanStrip";
import { Timeline } from "./Timeline";
import { TodayCard } from "./TodayCard";
import { ErrorState, LoadingState, NotFoundState } from "./states";
import { Icon, Section, ui } from "./ui";
import s from "./ReportScreen.module.css";

export function ReportScreen({ id, fail }: { id: string; fail: boolean }) {
  const { state, retry } = useReport(id, fail);
  return (
    <main className={s.page}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {state.status === "not-found" && <NotFoundState />}
      {state.status === "ready" && <Report report={state.report} />}
    </main>
  );
}

function Report({ report }: { report: SkinReport }) {
  const story = useMemo(() => buildStory(report), [report]);
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  const [guide, setGuide] = useState(false);
  const first = story.shape === "first";
  const open = (scanId: string) => setScanIndex(story.scans.findIndex((p) => p.scan.id === scanId));
  const name = report.person.firstName;

  return (
    <>
      <header className={s.top}>
        <div>
          <h1 className={s.title}>{first ? `Welcome, ${name}` : report.period ? "Monthly Report" : `${name}’s skin report`}</h1>
          <p className={s.period}>
            {fmtDay(story.start)} – {fmtDay(story.end)}
            {!first && ` · ${story.scans.length} scans · ${story.areas.length} area${story.areas.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <Dial story={story} onInfo={() => setGuide(true)} />

      <div className={s.story}>
        <h2 className={s.headline}>{story.headline}</h2>
        <p className={ui.body}>{story.subhead}</p>
      </div>

      <Section title={first ? "Your first scan" : "Your latest scan"} id="today">
        <TodayCard latest={story.latest} onOpen={() => open(story.latest.scan.id)} />
      </Section>

      {first ? (
        <Section title="What’s next" id="next">
          <FirstScan name={name} area={story.primaryArea} />
        </Section>
      ) : (
        <>
          <Section title="Your areas" id="areas">
            <Areas story={story} />
          </Section>

          {story.insights.length > 0 && (
            <Section title="Patterns across your skin" id="patterns">
              <Patterns insights={story.insights} />
            </Section>
          )}

          {story.events.length > 0 && (
            <Section title="What happened" id="events">
              <Timeline events={story.events} />
            </Section>
          )}

          {report.products && report.products.length > 0 && (
            <Section title="Your routine" id="routine" aside={`${fmtDay(story.start)} – ${fmtDay(story.end)}`}>
              <Routine products={report.products} end={story.end} />
            </Section>
          )}
        </>
      )}

      <Section title="Every scan" id="scans" aside={`${story.scans.length} in all`}>
        <ScanStrip scans={story.scans} areas={story.areas} onOpen={(p) => open(p.scan.id)} />
      </Section>

      <p className={ui.footnote}>
        <Icon name="info" size={16} />
        <span>
          Built from {story.scans.length === 1 ? "your first scan" : `your ${story.scans.length} scans`}
          {report.products?.length ? ", your routine" : ""} and the context you shared. These are patterns, not a diagnosis.
        </span>
      </p>

      <ScanSheet scans={story.scans} index={scanIndex} onIndex={setScanIndex} onClose={() => setScanIndex(null)} />
      <GuideSheet open={guide} onClose={() => setGuide(false)} />
    </>
  );
}
