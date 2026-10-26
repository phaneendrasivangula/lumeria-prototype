"use client";

import { useState } from "react";
import { METRIC_MOVE, METRICS, fmtDay, photoOf, scoreOf } from "@/lib/format";
import type { DayPoint } from "@/lib/story/types";
import type { MetricKey } from "@/lib/types";
import { Card, Icon } from "./ui";
import s from "./BeforeAfter.module.css";

/**
 * Before and after: the area's first and latest photo, one over the other, with a handle to drag between them, and the
 * measures that moved most between those two scans. Hidden when there aren't two photos to compare.
 */
export function BeforeAfter({ points, area }: { points: DayPoint[]; area: string }) {
  const [at, setAt] = useState(50);
  const withPhoto = points.filter((p) => photoOf(p.scan));
  if (withPhoto.length < 2) return null;
  const a = withPhoto[0];
  const b = withPhoto[withPhoto.length - 1];
  const moved = METRICS.map((m: MetricKey) => ({ m, x: scoreOf(a.scan, m), y: scoreOf(b.scan, m) }))
    .filter((d): d is { m: MetricKey; x: number; y: number } => d.x != null && d.y != null && d.x !== d.y)
    .sort((p, q) => Math.abs(q.y - q.x) - Math.abs(p.y - p.x))
    .slice(0, 3);
  const label = (p: DayPoint) => `${fmtDay(p.day)}${scoreOf(p.scan, "overall") != null ? ` · ${scoreOf(p.scan, "overall")}` : ""}`;

  return (
    <section aria-label="Before and after">
    <Card variant="glass" className={s.card}>
      <div className={s.head}>
        <h3 className={s.title}>Before and after</h3>
        <span className={s.hint}>Drag to compare</span>
      </div>
      <div className={s.frame}>
        {/* eslint-disable-next-line @next/next/no-img-element -- scan photos come from the API as plain URLs */}
        <img className={s.photo} src={photoOf(b.scan)!} alt={`${area} on ${fmtDay(b.day)}`} />
        <div className={s.before} style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- scan photos come from the API as plain URLs */}
          <img className={s.photo} src={photoOf(a.scan)!} alt={`${area} on ${fmtDay(a.day)}`} />
        </div>
        <span className={s.line} style={{ left: `${at}%` }} aria-hidden />
        <span className={s.handle} style={{ left: `${at}%` }} aria-hidden>
          <Icon name="swap_horiz" size={20} />
        </span>
        <span className={s.tag} data-side="left">
          {label(a)}
        </span>
        <span className={s.tag} data-side="right">
          {label(b)}
        </span>
        <input
          className={s.range}
          type="range"
          min={5}
          max={95}
          value={at}
          onChange={(e) => setAt(Number(e.target.value))}
          aria-label={`Compare ${fmtDay(a.day)} with ${fmtDay(b.day)}`}
        />
      </div>
      {moved.length > 0 && (
        <ul className={s.chips}>
          {moved.map((d) => (
            <li key={d.m} className={s.chip} data-good={d.y > d.x ? "" : undefined}>
              {METRIC_MOVE[d.m].tile} {d.x} → {d.y} · {d.y > d.x ? METRIC_MOVE[d.m].up : METRIC_MOVE[d.m].down}
            </li>
          ))}
        </ul>
      )}
    </Card>
    </section>
  );
}
