"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardAction, QuickCard } from "@/lib/story/cards";
import { ChipButton, Icon, Pill } from "./ui";
import s from "./QuickInsights.module.css";

/**
 * Quick insights: the month in a few cards you swipe through (scroll-snap), with arrows and dots for anyone not
 * swiping, and the current card's actions (Explain, Show data, or the next step) pinned under them.
 */
export function QuickInsights({ cards, onAction }: { cards: QuickCard[]; onAction: (a: CardAction) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = cards.length;

  const go = useCallback(
    (k: number) => {
      const el = rail.current;
      const to = Math.max(0, Math.min(n - 1, k));
      const card = el?.children[to] as HTMLElement | undefined;
      if (el && card) el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
      setI(to);
    },
    [n],
  );

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const on = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      kids.forEach((c, k) => {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(kids[best].offsetLeft + kids[best].offsetWidth / 2 - mid)) best = k;
      });
      setI(best);
    };
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  const current = cards[i];
  return (
    <div className={s.wrap} onKeyDown={(e) => (e.key === "ArrowRight" ? go(i + 1) : e.key === "ArrowLeft" ? go(i - 1) : undefined)}>
      <div className={s.stage}>
        <div ref={rail} className={s.rail} tabIndex={0} aria-roledescription="carousel" aria-label="Quick insights: use the arrow keys or swipe">
          {cards.map((c, k) => (
            <article
              key={c.id}
              className={s.card}
              data-tint={c.tint}
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${n}: ${c.title}`}
              aria-hidden={k !== i ? true : undefined}
            >
              <p className={s.eyebrow}>
                <Icon name={c.icon} size={18} />
                {c.eyebrow}
              </p>
              {c.tag && (
                <Pill tone={c.tag.tone} className={s.tag}>
                  {c.tag.label}
                </Pill>
              )}
              <h3 className={s.title}>
                {c.title} {c.value && <span className={s.value}>{c.value}</span>}
              </h3>
              <p className={s.body}>{c.body}</p>
              {c.rows.length > 0 && (
                <div className={s.rows}>
                  {c.rows.map((r) =>
                    r.kind === "bar" ? (
                      <div key={r.label} className={s.row}>
                        <span>
                          <span className={s.rowLabel}>{r.label}</span>
                          <span className={s.rowDetail}>{r.detail}</span>
                        </span>
                        <span className={s.barTrack} aria-hidden>
                          <span className={s.bar} data-tone={r.tone} style={{ width: `${Math.max(18, Math.round(84 * r.frac))}px` }} />
                        </span>
                      </div>
                    ) : (
                      <div key={r.label} className={s.row}>
                        <span className={s.rowMuted}>{r.label}</span>
                        <span className={s.rowValue} data-tone={r.tone}>
                          {r.value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
        <button type="button" className={s.arrow} data-side="left" aria-label="Previous card" disabled={i === 0} onClick={() => go(i - 1)}>
          <Icon name="chevron_left" size={22} />
        </button>
        <button type="button" className={s.arrow} data-side="right" aria-label="Next card" disabled={i === n - 1} onClick={() => go(i + 1)}>
          <Icon name="chevron_right" size={22} />
        </button>
      </div>

      <div className={s.dots} aria-hidden>
        {cards.map((c, k) => (
          <span key={c.id} className={s.dot} data-on={k === i ? "" : undefined} />
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        Card {i + 1} of {n}
      </p>

      <div className={s.actions}>
        {current?.actions.map((a) => (
          <ChipButton key={a.label} icon={a.icon} onClick={() => onAction(a)}>
            {a.label}
          </ChipButton>
        ))}
      </div>
      <p className={s.note}>Patterns from your scans, not a diagnosis.</p>
    </div>
  );
}
