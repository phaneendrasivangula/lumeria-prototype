"use client";

import Link from "next/link";
import { sparkline } from "@/lib/charts";
import type { AreaCard } from "@/lib/story/summary";
import { GlyphChip, Icon } from "./ui";
import s from "./AreaCards.module.css";

/** "Your areas": one card per area with its 3D face, the trend line, the latest score and its change. */
export function AreaCards({ cards, hrefFor }: { cards: AreaCard[]; hrefFor: (area: string) => string }) {
  return (
    <>
      <ul className={s.list}>
        {cards.map((c, i) => {
          const sp = sparkline(c.spark);
          const gid = `spark${i}`;
          const change =
            c.delta == null ? "too few scans for a trend yet" : c.delta === 0 ? "no change" : `${c.delta > 0 ? "up" : "down"} ${Math.abs(c.delta)}`;
          return (
            <li key={c.area}>
              <Link
                href={hrefFor(c.area)}
                className={s.card}
                data-hue={c.hue}
                aria-label={`${c.area}: ${c.score ?? "not measured"}, ${change}. ${c.scans} scan${c.scans === 1 ? "" : "s"}.`}
              >
                <span className={s.sparkWrap} aria-hidden>
                  <svg
                    className={s.spark}
                    width="200"
                    height="92"
                    viewBox="0 0 200 92"
                    data-hue={c.hue}
                    style={{ "--shift": `${sp.shift}px` } as React.CSSProperties}
                  >
                    <defs>
                      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" className={s.fillTop} />
                        <stop offset="1" className={s.fillBottom} />
                      </linearGradient>
                    </defs>
                    {!sp.sparse && <path d={sp.area} fill={`url(#${gid})`} />}
                    {!sp.sparse && <path d={sp.line} className={s.line} />}
                    {sp.sparse && sp.points.length === 2 && (
                      <path d={`M${sp.points[0].x} ${sp.points[0].y} L${sp.points[1].x} ${sp.points[1].y}`} className={s.dashed} />
                    )}
                    {sp.sparse && sp.points.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r="3.2" className={s.dot} />)}
                    {!sp.sparse && sp.end && <circle cx={sp.end.x} cy={sp.end.y} r="3.2" className={s.dot} />}
                  </svg>
                </span>
                <span className={s.name}>
                  <GlyphChip glyph={c.glyph} />
                  {c.area}
                </span>
                <span className={s.face}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static illustration, sized by CSS */}
                  <img src={c.image} alt="" width={90} height={90} />
                </span>
                <span className={s.figures}>
                  {c.delta != null ? (
                    <span className={s.change} data-dir={c.delta > 0 ? "up" : c.delta < 0 ? "down" : "flat"}>
                      {c.delta !== 0 && <Icon name="arrow_drop_up" size={21} flip={c.delta < 0} />}
                      {Math.abs(c.delta)}
                    </span>
                  ) : (
                    <span className={s.needs}>Needs more scans</span>
                  )}
                  <span className={s.score}>{c.score ?? "–"}</span>
                </span>
                <span className={s.chevron}>
                  <Icon name="chevron_right" size={18} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className={s.note}>Each area is compared with its own usual.</p>
    </>
  );
}
