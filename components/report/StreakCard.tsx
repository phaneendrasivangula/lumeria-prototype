"use client";

import { useId } from "react";
import type { Streak } from "@/lib/story/streak";
import { Icon } from "./ui";
import s from "./StreakCard.module.css";

export type StreakStyle = "a" | "b" | "c";

/** The Lumeria sun as a line drawing, for the card's watermark: outlined rays over a half sun and the water line. */
function Sun({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / 8);
    const long = i % 2 === 0;
    const r1 = long ? 118 : 98;
    return { x1: 120 + 64 * Math.cos(a), y1: 130 - 64 * Math.sin(a), x2: 120 + r1 * Math.cos(a), y2: 130 - r1 * Math.sin(a), w: long ? 16 : 13 };
  });
  // outlined shapes, as on the logo: a thick white stroke with a thinner black one cut out of it (an SVG mask)
  return (
    <svg className={className} viewBox="0 0 240 170" aria-hidden>
      <defs>
        <mask id={`sun${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="170">
          <g stroke="white" fill="none" strokeLinecap="round">
            {rays.map((r, i) => (
              <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth={r.w} />
            ))}
            <path d="M 66 130 A 54 54 0 0 1 174 130" strokeWidth="2.2" />
            <path d="M 8 142 C 70 126, 150 158, 234 134" strokeWidth="2" />
            <path d="M 40 157 C 92 146, 162 168, 212 152" strokeWidth="2" />
          </g>
          <g stroke="black" fill="none" strokeLinecap="round">
            {rays.map((r, i) => (
              <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth={r.w - 3.6} />
            ))}
          </g>
        </mask>
      </defs>
      <rect width="240" height="170" fill="currentColor" mask={`url(#sun${id})`} />
    </svg>
  );
}

/**
 * The scanning streak as a small glass card, a quiet visual break near the end of the report: the run of days in a
 * row, the month's days scanned and the best run, and a way into the full streak history (a placeholder for now).
 * Three looks: a: sunlit bone card, tilted, with a second card behind; b: evergreen with a gold sun;
 * c: sage glass with the month as a row of dots.
 */
export function StreakCard({ streak, look = "a", onMore }: { streak: Streak; look?: StreakStyle; onMore: () => void }) {
  const day = streak.current === 1 ? "day" : "days";
  return (
    <section className={s.wrap} data-look={look} aria-labelledby="streak-title">
      <div className={s.stack}>
        <span className={s.behind} aria-hidden />
        <div className={s.card}>
          <Sun className={s.sun} />
          <p className={s.eyebrow} id="streak-title">
            Your streak
          </p>
          <p className={s.count}>
            <span className={s.number}>{streak.current}</span>
            <span className={s.unit}>
              {day} in a row
              <span className={s.flame} aria-hidden>
                <Icon name="sun" size={16} />
              </span>
            </span>
          </p>
          {look === "c" && (
            <div className={s.dots} aria-hidden>
              {streak.marks.map((m, i) => (
                <span key={i} className={s.dot} data-on={m ? "" : undefined} data-last={i === streak.marks.length - 1 ? "" : undefined} />
              ))}
            </div>
          )}
          <p className={s.meta}>
            {streak.days} of {streak.total} days scanned · best run {streak.best}
          </p>
          <button type="button" className={s.more} onClick={onMore}>
            View your streaks
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
