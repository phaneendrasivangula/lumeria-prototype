"use client";

import { useState } from "react";
import type { Insight } from "@/lib/insights";
import { METRIC_COPY } from "@/lib/format";
import { Card, Pill, ui } from "./ui";
import s from "./report.module.css";

/** Patterns, honest about how sure we are. "Show data" opens the numbers behind each one. */
export function Patterns({ insights }: { insights: Insight[] }) {
  return (
    <div className={s.patterns}>
      {insights.map((ins) => (
        <PatternCard key={ins.id} insight={ins} />
      ))}
    </div>
  );
}

function PatternCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false);
  const panel = `data-${insight.id}`;
  const tone = insight.caveat ? "unsure" : insight.strength === "Clear pattern" ? "good" : "watch";
  const label = insight.caveat ? "Can’t separate yet" : insight.strength === "Clear pattern" ? "Likely" : "Possible";
  const max = Math.max(insight.a.value, insight.b.value, 1);
  return (
    <Card as="article">
      <Pill tone={tone}>{label}</Pill>
      <h3 className={s.patternTitle}>{insight.title}</h3>
      <p className={s.patternBody}>{insight.body}</p>
      {insight.caveat && <p className={s.caveat}>{insight.caveat}</p>}
      <button type="button" className={ui.chip} style={{ marginTop: 14 }} aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide data" : "Show data"}
      </button>
      {open && (
        <div id={panel}>
          <div className={s.compare}>
            {[insight.a, insight.b].map((g, i) => (
              <div key={g.label} className={s.bar}>
                <span>
                  {g.label} · {g.n} scan{g.n === 1 ? "" : "s"}
                </span>
                <b>{g.value}</b>
                <div className={s.barTrack} aria-hidden>
                  <div className={s.barFill} style={{ width: `${(g.value / max) * 100}%`, background: i === 0 ? "#c9934f" : "#5f8466" }} />
                </div>
              </div>
            ))}
            <span className={s.areaNote}>Average {METRIC_COPY[insight.metric].label.toLowerCase()} score. Higher is always better.</span>
          </div>
          {insight.evidence.length > 0 && (
            <ul className={s.evidence}>
              {insight.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
