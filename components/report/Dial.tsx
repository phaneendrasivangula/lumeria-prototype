"use client";

import { useEffect, useId, useState } from "react";
import { arcPath, arcPoint } from "@/lib/charts";
import { DIAL, type DialModel } from "@/lib/story/dial";
import { AreaGlyph, DeltaPill, Icon } from "./ui";
import s from "./Dial.module.css";

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

/** Counts a number up from zero as the dial draws in. Shows the final value straight away under reduced motion. */
function useCountUp(target: number | null, ms = 1250, lead = 200): number | null {
  const [v, setV] = useState<number | null>(target);
  useEffect(() => {
    if (target == null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + lead;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - t0) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, lead]);
  return v;
}

/**
 * The month on one dial: a ring per area (most-scanned outermost), one mark per scan from the first day (left) to the
 * last (right), each coloured by that scan's redness band. Thin inner arcs are products; markers outside are trips and
 * cycle starts. Tapping an area's label highlights its ring.
 */
export function Dial({
  model,
  score,
  delta,
  since,
  onInfo,
  label,
  decorative,
}: {
  model: DialModel;
  score: number | null;
  delta: number | null;
  since: string;
  onInfo?: () => void;
  label: string;
  /** A static copy (in the score guide): no buttons, no count-up. */
  decorative?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const [sel, setSel] = useState<string | null>(null);
  const counted = useCountUp(score);
  const shown = decorative ? score : counted;
  const { cx, cy, w, h } = DIAL;
  const R = model.rings[0]?.r ?? 164.55;
  const x1 = cx - R;
  const x2 = cx + R;
  const ringCount = model.rings.length;

  return (
    <div className={s.dial} data-decorative={decorative ? "" : undefined}>
      <svg className={s.svg} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id={`${uid}track`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.trackTop} />
            <stop offset="1" className={s.trackBottom} />
          </linearGradient>
          <filter id={`${uid}sh`} filterUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <feDropShadow dx="0" dy="2.7" stdDeviation="2.7" className={s.shadow} />
          </filter>
          <radialGradient id={`${uid}glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className={s.glow1} />
            <stop offset="0.55" className={s.glow2} />
            <stop offset="1" className={s.glow3} />
          </radialGradient>
          {model.rings.map((ring, i) => (
            <linearGradient key={ring.area} id={`${uid}w${i}`} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
              {ring.marks.map((m) => (
                <stop key={m.id} offset={((m.x - x1) / (x2 - x1)).toFixed(4)} className={s.stop} data-band={m.band} />
              ))}
            </linearGradient>
          ))}
        </defs>
        {model.dots ? (
          <ellipse cx={cx} cy={226} rx={137} ry={104} fill={`url(#${uid}glow)`} opacity={0.8} />
        ) : (
          <ellipse cx={cx} cy={172} rx={150} ry={82} fill={`url(#${uid}glow)`} />
        )}
        {model.rings.map((ring, i) => {
          const track = arcPath(cx, cy, ring.r, model.start, 1);
          return (
            <g
              key={ring.area}
              className={s.ring}
              data-dim={sel && sel !== ring.area ? "" : undefined}
              data-faint={model.dots && !sel && i > 0 ? "" : undefined}
            >
              <path d={track} className={s.track} stroke={`url(#${uid}track)`} strokeWidth={ring.track} />
              <path d={track} className={s.trackTint} strokeWidth={ring.track} />
              {ring.marks.map((m) => {
                const delay = 120 + i * 150 + ((m.f0 + m.f1) / 2) * 620;
                if (model.dots) {
                  const a = Math.PI * (1 - m.f0);
                  return (
                    <circle
                      key={m.id}
                      cx={cx + ring.r * Math.cos(a)}
                      cy={cy - ring.r * Math.sin(a)}
                      r={ring.width / 2}
                      className={s.dot}
                      data-band={m.band}
                      filter={`url(#${uid}sh)`}
                      style={{ "--d": `${delay}ms` } as React.CSSProperties}
                    />
                  );
                }
                return (
                  <path
                    key={m.id}
                    d={arcPath(cx, cy, ring.r, m.f0, m.f1)}
                    pathLength={1}
                    className={s.mark}
                    stroke={`url(#${uid}w${i})`}
                    strokeWidth={ring.width}
                    filter={`url(#${uid}sh)`}
                    style={{ "--d": `${delay}ms` } as React.CSSProperties}
                  />
                );
              })}
            </g>
          );
        })}
        {model.products.map((p) => (
          <path
            key={p.name}
            d={arcPath(cx, cy, p.r, p.f0, p.f1)}
            pathLength={1}
            className={s.product}
            data-active={p.active ? "" : undefined}
            strokeWidth={p.active ? 3.3 : 3.8}
            style={{ "--d": `${200 + ringCount * 150 + p.f0 * 620}ms` } as React.CSSProperties}
          />
        ))}
      </svg>

      {model.markers.map((m) => (
        <span
          key={`${m.kind}${m.x}`}
          className={s.marker}
          data-kind={m.kind}
          title={m.label}
          style={{ "--x": pct(m.x, w), "--y": pct(m.y, h), "--d": `${300 + ringCount * 150 + 500}ms` } as React.CSSProperties}
        >
          <Icon name={m.kind === "trip" ? "flight" : "water_drop"} size={12} />
          <span className="visually-hidden">{m.label}</span>
        </span>
      ))}

      {decorative && (
        <div className={s.keys} aria-hidden>
          {model.rings.map((ring, i) => {
            const at = arcPoint(cx, cy, ring.r, model.start + [0.04, 0.24, 0.1, 0.16][i]);
            return (
              <span key={ring.area} className={s.key} style={{ "--x": pct(at.x, w), "--y": pct(at.y, h) } as React.CSSProperties}>
                <AreaGlyph glyph={ring.glyph} size={12} />
              </span>
            );
          })}
          {model.products[0] && (
            <span
              className={s.key}
              style={
                {
                  "--x": pct(arcPoint(cx, cy, model.products[0].r, (model.products[0].f0 + model.products[0].f1) / 2).x, w),
                  "--y": pct(arcPoint(cx, cy, model.products[0].r, (model.products[0].f0 + model.products[0].f1) / 2).y, h),
                } as React.CSSProperties
              }
            >
              {ringCount + 1}
            </span>
          )}
          <span className={s.key} style={{ "--x": "50%", "--y": "98%" } as React.CSSProperties}>
            {ringCount + (model.products.length ? 2 : 1)}
          </span>
        </div>
      )}

      <div className={s.center}>
        <p className={s.score}>
          <span className={s.number}>
            <span aria-hidden>{shown ?? "–"}</span>
            {onInfo && !decorative && (
              <button type="button" className={s.info} onClick={onInfo} aria-label="How to read your score">
                <Icon name="info_i" size={14} />
              </button>
            )}
          </span>
          <span className="visually-hidden">Overall score {score ?? "not measured"} out of 100</span>
        </p>
        {delta != null && (
          <p className={s.delta}>
            <DeltaPill delta={delta} since={since} />
          </p>
        )}
      </div>

      {ringCount > 1 && !decorative && (
        <div className={s.labels} data-text={model.dots ? "" : undefined}>
          {model.rings.map((ring, i) => (
            <button
              key={ring.area}
              type="button"
              className={s.ringLabel}
              aria-pressed={sel === ring.area}
              aria-label={`${ring.area}: highlight its ring`}
              data-dim={(sel && sel !== ring.area) || (model.dots && !sel && i > 0) ? "" : undefined}
              style={{ "--x": pct(cx - ring.r - (model.dots ? 7 : 9.5), w) } as React.CSSProperties}
              onClick={() => setSel((v) => (v === ring.area ? null : ring.area))}
            >
              {model.dots ? (
                <span className={s.vertical}>{ring.label}</span>
              ) : (
                <span className={s.chip}>
                  <AreaGlyph glyph={ring.glyph} size={12.5} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
