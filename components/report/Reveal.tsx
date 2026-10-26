"use client";

import { useEffect, useId, useRef } from "react";
import { brief } from "@/lib/format";
import type { Summary } from "@/lib/story/summary";
import { Icon } from "./ui";
import s from "./Reveal.module.css";

const CX = 201;
const CY = 165;
const R = 126;

/** The ring up to `v` out of 100, starting at the top and running clockwise. */
function arc(v: number): string {
  const f = Math.max(0.001, Math.min(0.999, v / 100));
  const x = CX + R * Math.sin(2 * Math.PI * f);
  const y = CY - R * Math.cos(2 * Math.PI * f);
  return `M ${CX} ${CY - R} A ${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
}

const TICKS = Array.from({ length: 160 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 160;
  return {
    x1: CX + (R + 13) * Math.cos(a),
    y1: CY + (R + 13) * Math.sin(a),
    x2: CX + (R + 18) * Math.cos(a),
    y2: CY + (R + 18) * Math.sin(a),
  };
});

/**
 * The reveal: the month in one number and one sentence, between loading and the report. The ring draws itself to the
 * score, then the words and the button rise. "See your report" (or Escape) opens the summary underneath; the quieter
 * link opens the quick-insight cards over it. Still and complete under prefers-reduced-motion.
 */
export function Reveal({
  summary,
  onDone,
  cards = 0,
  onCards,
}: {
  summary: Summary;
  onDone: () => void;
  cards?: number;
  onCards?: () => void;
}) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const score = summary.score ?? 0;
  const end = {
    x: CX + R * Math.sin((2 * Math.PI * score) / 100),
    y: CY - R * Math.cos((2 * Math.PI * score) / 100),
  };
  const sub = summary.first
    ? "your starting point"
    : summary.delta != null && summary.delta !== 0
      ? `${summary.delta > 0 ? "▲" : "▼"} ${Math.abs(summary.delta)} ${summary.since}`
      : `steady ${summary.since}`;

  useEffect(() => {
    box.current?.focus({ preventScroll: true }); // into the dialog, without a focus ring on the button
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", onKey);
    const root = document.documentElement;
    root.dataset.reveal = "open";
    return () => {
      window.removeEventListener("keydown", onKey);
      delete root.dataset.reveal;
    };
  }, [onDone]);

  return (
    <div ref={box} tabIndex={-1} className={s.reveal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={s.sky} aria-hidden />
      <div className={s.sun} aria-hidden />
      <div className={s.column}>
        <header className={s.top}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative brand mark */}
          <img className={s.logo} src="/brand/lumeria-sun.png" alt="Lumeria" width={58} height={36} />
          <p className={s.eyebrow}>
            {summary.title} · {summary.period.label}
          </p>
        </header>

        <div className={s.hero}>
          <svg className={s.ring} viewBox="0 0 402 330" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <filter id="rv-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <radialGradient id="rv-in" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.55" className={s.edgeStop} stopOpacity="0" />
                <stop offset="1" className={s.edgeStop} stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R} fill="url(#rv-in)" />
            <g className={s.ticks}>
              {TICKS.map((t, i) => (
                <line key={i} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)} />
              ))}
            </g>
            <circle cx={CX} cy={CY} r={R} className={s.track} />
            {score > 0 && (
              <>
                <path d={arc(score)} className={`${s.arc} ${s.arcGlow}`} pathLength={100} filter="url(#rv-glow)" />
                <path d={arc(score)} className={`${s.arc} ${s.arcCore}`} pathLength={100} />
                <circle cx={end.x} cy={end.y} r={9} className={s.dotGlow} filter="url(#rv-glow)" />
                <circle cx={end.x} cy={end.y} r={4.5} className={s.dot} />
              </>
            )}
          </svg>
          <div className={s.number}>
            <span className={s.score}>{summary.score ?? "–"}</span>
            <span className={s.label}>skin score</span>
            <span className={s.sub}>{sub}</span>
          </div>
        </div>

        <div className={s.words}>
          <h1 id={titleId} className={s.headline}>
            {summary.headline[0]} <span className={s.tail}>{summary.headline[1]}</span>
          </h1>
          <p className={s.subhead}>{brief(summary.subhead)}</p>
        </div>

        <div className={s.ctas}>
          <button type="button" className={s.primary} onClick={onDone}>
            See your report
          </button>
          {onCards && cards > 0 && (
            <button type="button" className={s.link} onClick={onCards}>
              <Icon name="style" size={17} />
              Or swipe through your month in {cards} cards
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Loading, on the reveal's own screen: the logo, an empty ring with a light travelling round it, and a plain line. */
export function RevealLoading() {
  return (
    <div className={s.reveal} aria-busy="true">
      <div className={s.sky} aria-hidden />
      <div className={s.sun} aria-hidden />
      <div className={s.column}>
        <header className={`${s.top} ${s.arrive}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a small decorative brand mark */}
          <img className={s.logo} src="/brand/lumeria-sun.png" alt="Lumeria" width={58} height={36} />
          <p className={s.eyebrow}>Monthly report</p>
        </header>
        <div className={s.hero}>
          <svg className={s.ring} viewBox="0 0 402 330" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <g className={s.ticksIn}>
              <g className={s.ticks}>
                {TICKS.map((t, i) => (
                  <line key={i} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)} />
                ))}
              </g>
            </g>
            <circle cx={CX} cy={CY} r={R} className={s.track} />
            <circle cx={CX} cy={CY} r={R} className={s.seek} pathLength={100} />
          </svg>
        </div>
        {/* the same space as the reveal's words and buttons, so the ring doesn't move when the month arrives */}
        <div className={`${s.words} ${s.wordsNow}`}>
          <p className={s.gather} role="status">
            Gathering your month…
          </p>
          <p className={s.subhead}>This only takes a moment</p>
        </div>
        <div className={s.ctasSpace} aria-hidden />
      </div>
    </div>
  );
}
