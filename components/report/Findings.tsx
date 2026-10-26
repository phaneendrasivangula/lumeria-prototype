"use client";

import { useState } from "react";
import type { Finding } from "@/lib/story/types";
import { Card, ChipButton, Icon, MatchQuestion, Pill } from "./ui";
import s from "./Findings.module.css";

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
                  {f.confidence && (
                    <span className={s.pillRow}>
                      <Pill tone={f.tone}>{f.confidence}</Pill>
                    </span>
                  )}
                  <span className={s.title}>{f.title}</span>
                  <span className={s.body}>{f.body}</span>
                </span>
                <span className={s.chevron}>
                  <Icon name="chevron_right" size={18} />
                </span>
              </button>
              {chips && (
                <div className={s.actions}>
                  <ChipButton icon={variant === "summary" ? "flare" : undefined} onClick={() => onExplain(f)} aria-label={`Explain: ${f.title}`}>
                    Explain
                  </ChipButton>
                  <ChipButton onClick={() => onShowData(f)} aria-label={`Show data: ${f.title}`}>
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
