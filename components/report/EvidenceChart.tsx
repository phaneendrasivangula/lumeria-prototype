import { useId } from "react";
import { bandOf } from "@/lib/bands";
import { fitY, smoothPath } from "@/lib/charts";
import { METRIC_COPY, fmtDay } from "@/lib/format";
import type { EvidenceSeries } from "@/lib/story/series";
import s from "./EvidenceChart.module.css";

const W = 354;
const H = 96;

/** One measure across the period, coloured by band, with the stretches a finding is about shaded behind it. */
export function EvidenceChart({ data, start, end }: { data: EvidenceSeries; start: string; end: string }) {
  const gid = useId().replace(/:/g, "");
  const y = fitY(
    data.points.map((p) => p.v),
    14,
    84,
  );
  const x = (f: number) => 6 + f * (W - 12);
  const pts = data.points.map((p) => ({ x: x(p.f), y: y(p.v) }));
  const name = data.metric === "overall" ? "overall" : METRIC_COPY[data.metric].label.toLowerCase();
  const focus = data.focus ? { x: x(data.focus.f), y: y(data.focus.v) } : null;
  const nearEdge = focus && (focus.x < 60 || focus.x > W - 90);
  return (
    <svg
      className={s.chart}
      viewBox={`0 0 ${W} 126`}
      role="img"
      aria-label={`${name} from ${fmtDay(start)} to ${fmtDay(end)}: ${data.points.map((p) => p.v).join(", ")}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          {data.points.map((p, i) => (
            <stop key={i} offset={((x(p.f) - 6) / (W - 12)).toFixed(3)} className={s.stop} data-band={bandOf(p.v)} />
          ))}
        </linearGradient>
      </defs>
      {data.windows.map((w, i) => (
        <rect key={i} x={x(w.f0)} y="0" width={Math.max(8, x(w.f1) - x(w.f0))} height={H} rx="6" className={s.window} data-tone={w.tone} />
      ))}
      {pts.length > 1 ? (
        <path d={smoothPath(pts)} stroke={`url(#${gid})`} className={s.line} />
      ) : (
        pts[0] && <circle cx={pts[0].x} cy={pts[0].y} r="4" className={s.single} />
      )}
      {focus && data.focus && (
        <>
          <line x1={focus.x} x2={focus.x} y1={focus.y + 8} y2={104} className={s.tick} />
          <circle cx={focus.x} cy={focus.y} r="4.5" className={s.focus} />
          {!nearEdge && (
            <text x={focus.x} y="120" textAnchor="middle" className={s.focusLabel}>
              {fmtDay(data.focus.day)}
            </text>
          )}
        </>
      )}
      <text x="0" y="120" className={s.axis}>
        {fmtDay(start)}
      </text>
      <text x={W} y="120" textAnchor="end" className={s.axis}>
        {fmtDay(end)} · {name}
      </text>
    </svg>
  );
}
