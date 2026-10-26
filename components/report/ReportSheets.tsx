"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DialModel } from "@/lib/story/dial";
import { topicsFrom, type LumiTopic } from "@/lib/story/lumi";
import type { QuickCard } from "@/lib/story/cards";
import type { Summary } from "@/lib/story/summary";
import { EvidenceSheet } from "./EvidenceSheet";
import { GuideSheet } from "./GuideSheet";
import { LumiSheet } from "./LumiSheet";
import { QuickInsights } from "./QuickInsights";
import { Button, GlyphChip, Icon, Sheet, useToast } from "./ui";
import s from "./ReportSheets.module.css";

export type SheetState = { kind: "evidence"; id: string } | { kind: "lumi"; topic: LumiTopic } | { kind: "guide" } | { kind: "areas" } | { kind: "cards" } | null;

/**
 * One page sheet for the whole report, whose content follows what was asked for: Show data, Explain (Lumi), the score
 * guide, or the area picker. Moving from Show data to Lumi swaps the content inside the same sheet.
 */
export function ReportSheets({
  sheet,
  setSheet,
  summary,
  dial,
  area,
  extraTopics = [],
  areaLinks = [],
  cards = [],
  onSuggestion,
}: {
  sheet: SheetState;
  setSheet: (s: SheetState) => void;
  summary: Summary;
  dial: DialModel;
  area: string;
  extraTopics?: LumiTopic[];
  areaLinks?: { area: string; href: string; glyph: Parameters<typeof GlyphChip>[0]["glyph"]; current: boolean }[];
  cards?: QuickCard[];
  onSuggestion?: (id: string) => void;
}) {
  const toast = useToast();
  const close = () => setSheet(null);
  // Keep showing the last content while the sheet slides away.
  const [last, setLast] = useState<SheetState>(sheet);
  useEffect(() => {
    if (sheet) setLast(sheet);
  }, [sheet]);
  const shown = sheet ?? last;
  const { story, period } = summary;
  const finding = shown?.kind === "evidence" ? summary.findings.find((f) => f.id === shown.id) : undefined;
  const topics = [...extraTopics, ...topicsFrom(summary.findings)];

  let label = "";
  let title: string | undefined;
  let footer: React.ReactNode = undefined;
  let body: React.ReactNode = null;

  if (finding) {
    label = `Show data: ${finding.title}`;
    footer = finding.cta ? (
      <Button kind="primary" onClick={() => toast("Your 2-week test is set up in the Lumeria app")}>
        {finding.cta}
      </Button>
    ) : undefined;
    body = (
      <EvidenceSheet
        finding={finding}
        story={story}
        start={period.start}
        end={period.end}
        onAskLumi={() => setSheet({ kind: "lumi", topic: { script: finding.lumi, findingId: finding.id } })}
      />
    );
  } else if (shown?.kind === "lumi") {
    label = `Lumi: ${shown.topic.script.title}`;
    body = (
      <LumiSheet
        key={shown.topic.script.question}
        first={shown.topic}
        topics={topics}
        findings={summary.findings}
        story={story}
        start={period.start}
        end={period.end}
        area={area}
        onBack={close}
      />
    );
  } else if (shown?.kind === "guide") {
    label = "How to read your score";
    title = "How to read your score";
    body = <GuideSheet dial={dial} score={summary.score} start={period.start} end={period.end} />;
  } else if (shown?.kind === "cards" && cards.length) {
    label = "Quick insights";
    title = "Your month";
    body = (
      <QuickInsights
        cards={cards}
        onAction={(a) => {
          const f = summary.findings.find((x) => a.kind !== "suggestion" && x.id === a.findingId);
          if (a.kind === "lumi" && f) setSheet({ kind: "lumi", topic: { script: f.lumi, findingId: f.id } });
          else if (a.kind === "evidence" && f) setSheet({ kind: "evidence", id: f.id });
          else if (a.kind === "suggestion") {
            close();
            onSuggestion?.(a.suggestionId);
          }
        }}
      />
    );
  } else if (shown?.kind === "areas") {
    label = "Choose an area";
    title = "Choose an area";
    body = (
      <ul className={s.areas}>
        {areaLinks.map((a) => (
          <li key={a.area}>
            <Link href={a.href} className={s.area} aria-current={a.current ? "page" : undefined} onClick={close}>
              <GlyphChip glyph={a.glyph} />
              <span className={s.areaName}>{a.area}</span>
              <Icon name="chevron_right" size={18} />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Sheet open={!!sheet && !!body} onClose={close} label={label || "Details"} title={title} footer={footer}>
      {body}
    </Sheet>
  );
}
