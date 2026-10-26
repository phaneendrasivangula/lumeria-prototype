"use client";

import { useState } from "react";
import { brief } from "@/lib/format";
import type { Finding } from "@/lib/story/types";
import { Card, ChipButton, Icon, type IconName, MatchQuestion, Pill } from "./ui";
import s from "./Findings.module.css";

/** What each kind of finding is about, as a glyph: a product, a trip, sleep, a stretch of days, a trend, a gap. */
const KIND_ICON: Record<Finding["kind"], IconName> = {
  swap: "spa",
  confound: "join_inner",
  trip: "flight",
  sleep: "moon",
  stress: "waves",
  dip: "history",
  trend: "bar_chart",
  steady: "water_drop",
  missing: "info",
};

/**
 * A list of patterns, each saying how sure it is. On the Summary the first one carries Explain / Show data and the
 * rest open their evidence; on an area page ("What we noticed") every one carries both.
 */
export function Findings({
  findings,
  variant,
  onExplain,
  onShowData,
}: {
  findings: Finding[];
  variant: "summary" | "area";
  onExplain: (f: Finding) => void;
  onShowData: (f: Finding) => void;
}) {
  const [match, setMatch] = useState<string | null>(null);
  return (
    <Card variant={variant === "summary" ? "panel" : "glass"} className={s.card} as="div">
      <ul className={s.list} data-variant={variant}>
        {findings.map((f, i) => {
          const chips = variant === "area" || i === 0;
          return (
            <li key={f.id} className={s.item}>
              <button type="button" className={s.main} onClick={() => onShowData(f)}>
                <span className={s.text}>
                  <span className={s.pillRow}>
                    <span className={s.kind} data-tone={f.tone} aria-hidden>
                      <Icon name={KIND_ICON[f.kind]} size={16} />
                    </span>
                    {f.confidence && <Pill tone={f.tone}>{f.confidence}</Pill>}
                  </span>
                  <span className={s.title}>{f.title}</span>
                  <span className={s.body}>{brief(f.body)}</span>
                </span>
                <span className={s.chevron}>
                  <Icon name="chevron_right" size={18} />
                </span>
              </button>
              {chips && (
                <div className={s.actions}>
                  <ChipButton icon="flare" onClick={() => onExplain(f)} aria-label={`Explain: ${f.title}`}>
                    Explain
                  </ChipButton>
                  <ChipButton icon="description" onClick={() => onShowData(f)} aria-label={`Show data: ${f.title}`}>
                    Show data
                  </ChipButton>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {variant === "summary" && (
        <>
          <MatchQuestion value={match} onChange={setMatch} />
          <div className={s.spacer} />
        </>
      )}
    </Card>
  );
}
