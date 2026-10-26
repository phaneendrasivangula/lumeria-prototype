"use client";

import { useState, type CSSProperties } from "react";
import type { Insight } from "@/lib/story";
import { METRIC_COPY } from "@/lib/format";
import { Card, Pill, ui, type Tone } from "./ui";
import s from "./Patterns.module.css";

/** How sure we are, in words people use. A caveat (e.g. two causes overlap) always wins over strength. */
function certainty(insight: Insight): { tone: Tone; label: string } {
  if (insight.caveat) return { tone: "unsure", label: "Can’t separate yet" };
  if (insight.strength === "Clear pattern") return { tone: "good", label: "Likely" };
  return { tone: "watch", label: "Possible" };
}

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
  const { tone, label } = certainty(insight);
  const max = Math.max(insight.a.value, insight.b.value, 1);
  return (
    <Card as="article">
      <Pill tone={tone}>{label}</Pill>
      <h3 className={s.patternTitle}>{insight.title}</h3>
      <p className={s.patternBody}>{insight.body}</p>
      {insight.caveat && <p className={s.caveat}>{insight.caveat}</p>}
      <button type="button" className={`${ui.chip} ${s.toggle}`} aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)}>
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
                  <div className={s.barFill} data-variant={i === 0 ? "group" : "rest"} style={{ "--w": `${(g.value / max) * 100}%` } as CSSProperties} />
                </div>
              </div>
            ))}
            <span className={ui.note}>Average {METRIC_COPY[insight.metric].label.toLowerCase()} score. Higher is always better.</span>
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
