"use client";

import { useEffect, useRef } from "react";
import type { Streak } from "@/lib/story/streak";
import { Icon } from "./ui";
import s from "./StreakCard.module.css";

/**
 * The scanning streak as one vertical glass card over soft colour: a visual pause in a text-heavy report and a nudge to
 * keep scanning. The run of days in a row, the month as dots, one encouraging line with the real numbers, and "View
 * your streaks" (a placeholder for now).
 *
 * It has depth: the card tilts gently as it scrolls through the screen and follows a finger or pointer, its layers
 * (number, dots, words) sit at different depths, and a soft glare slides across the glass. Still under reduced motion.
 */
export function StreakCard({ streak, onMore }: { streak: Streak; onMore: () => void }) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = card.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      // scrolling: -1 when the card enters at the bottom of the screen, +1 as it leaves at the top
      const travel = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      let rx = -travel * 9;
      let ry = 3;
      let gx = 50 + travel * 30;
      let gy = 30 - travel * 40;
      if (pointer) {
        const px = (pointer.x - r.left) / r.width - 0.5;
        const py = (pointer.y - r.top) / r.height - 0.5;
        ry = px * 16;
        rx = -py * 14;
        gx = 50 + px * 90;
        gy = 50 + py * 90;
      }
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--gx", `${gx.toFixed(1)}%`);
      el.style.setProperty("--gy", `${gy.toFixed(1)}%`);
    };
    const ask = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const move = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      ask();
    };
    const leave = () => {
      pointer = null;
      ask();
    };
    paint();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointercancel", leave);
    };
  }, []);

  return (
    <section className={s.wrap} aria-labelledby="streak-title">
      <div className={s.scene}>
        <span className={s.blobA} aria-hidden />
        <span className={s.blobB} aria-hidden />
        <span className={s.blobC} aria-hidden />
        <div ref={card} className={s.card}>
          <span className={s.pane} aria-hidden />
          <span className={s.glare} aria-hidden />
          <p className={`${s.eyebrow} ${s.near}`} id="streak-title">
            <Icon name="sun" size={16} />
            Your streak
          </p>
          <p className={`${s.count} ${s.nearest}`}>
            <span className={s.number}>{streak.current}</span>
            <span className={s.unit}>{streak.current === 0 ? "a fresh start" : streak.current === 1 ? "day in a row" : "days in a row"}</span>
          </p>
          <div className={`${s.dots} ${s.near}`} aria-hidden>
            {streak.marks.map((m, i) => (
              <span key={i} className={s.dot} data-on={m ? "" : undefined} />
            ))}
          </div>
          <p className={`${s.nudge} ${s.near}`}>{streak.nudge}</p>
          <p className={`${s.meta} ${s.near}`}>
            {streak.days} of {streak.total} days scanned · best run {streak.best}
          </p>
          <button type="button" className={`${s.more} ${s.nearest}`} onClick={onMore}>
            View your streaks
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
