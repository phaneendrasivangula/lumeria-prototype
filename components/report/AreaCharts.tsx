import { useId } from "react";
import { areaPath, fitY, smoothPath } from "@/lib/charts";
import type { MetricKey } from "@/lib/types";
import { METRIC_COPY } from "@/lib/format";
import type { AreaDetail, MetricRow, SeriesPoint } from "@/lib/story/area";
import { Card, Icon, type IconName } from "./ui";
import s from "./AreaCharts.module.css";

const ICON: Record<MetricKey, IconName> = { hydration: "water_drop", evenness: "waves", pigmentation: "contrast", oiliness: "opacity", redness: "flare" };

function Axis({ labels }: { labels: [string, string, string] }) {
  return (
    <p className={s.axis} aria-hidden>
      <span>{labels[0]}</span>
      <span>{labels[1]}</span>
      <span className={s.axisEnd}>{labels[2]}</span>
    </p>
  );
}

/** The lead measure (usually redness): latest value, where it started, and a soft area chart across the period. */
export function LeadCard({ detail }: { detail: AreaDetail }) {
  const gid = useId().replace(/:/g, "");
  const pts = detail.series[detail.lead.metric];
  const W = 322;
  const H = 76;
  const y = fitY(
    pts.map((p) => p.v),
    10.8,
    63.4,
    20,
  );
  const xy = pts.map((p) => ({ x: p.f * W, y: y(p.v) }));
  const last = xy[xy.length - 1];
  const { lead } = detail;
  const name = METRIC_COPY[lead.metric].label.toLowerCase();
  return (
    <Card className={`${s.lead} ${lead.up === false && lead.word !== "about the same" ? s.down : ""}`}>
      <div className={s.leadTop}>
        <span className={s.leadValue}>
          {lead.latest ?? "–"}
          <span className="visually-hidden"> {name} on your latest scan</span>
        </span>
        {lead.first != null && lead.latest != null && pts.length > 1 && (
          <span className={s.leadFrom} data-dir={lead.word === "about the same" ? "flat" : lead.up ? "up" : "down"}>
            from {lead.first} · {lead.word}
          </span>
        )}
      </div>
      <div className={s.leadChart}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={s.leadSvg}
          role="img"
          aria-label={`${METRIC_COPY[lead.metric].label} on each scan: ${pts.map((p) => p.v).join(", ")}`}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={s.fillTop} />
              <stop offset="1" className={s.fillBottom} />
            </linearGradient>
          </defs>
          {xy.length > 1 && <path d={areaPath(xy, H)} fill={`url(#${gid})`} />}
          {xy.length > 1 && <path d={smoothPath(xy)} className={s.leadLine} vectorEffect="non-scaling-stroke" />}
        </svg>
        {last && <span className={s.endDot} style={{ "--x": `${(last.x / W) * 100}%`, "--y": `${(last.y / H) * 100}%` } as React.CSSProperties} aria-hidden />}
      </div>
      <Axis labels={detail.axis} />
    </Card>
  );
}

/** The other four measures on one chart, with trips and cycle days shaded, then a row per measure: first → last. */
export function MetricsCard({ detail }: { detail: AreaDetail }) {
  const W = 322;
  const all = detail.others.flatMap((m) => detail.series[m].map((p) => p.v));
  const y = fitY(all, 44, 141, 20);
  const line = (pts: SeriesPoint[]) => pts.map((p) => ({ x: p.f * W, y: y(p.v) }));
  return (
    <Card className={s.metrics}>
      <svg viewBox={`0 0 ${W} 170`} preserveAspectRatio="none" className={s.metricsSvg} aria-hidden>
        <defs>
          {detail.others.map((m) => (
            <linearGradient key={m} id={`mg-${m}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={s.mFillTop} data-metric={m} />
              <stop offset="1" className={s.mFillBottom} data-metric={m} />
            </linearGradient>
          ))}
        </defs>
        {[48, 88, 128].map((g) => (
          <line key={g} x1="0" x2={W} y1={g} y2={g} className={s.grid} />
        ))}
        {detail.shades.map((sh, i) => (
          <rect
            key={i}
            x={sh.f0 * W}
            y="8"
            width={Math.max(6, (sh.f1 - sh.f0) * W)}
            height="140"
            rx={sh.kind === "trip" ? 4 : 3}
            className={s.shade}
            data-kind={sh.kind}
          />
        ))}
        {detail.others.map((m) => {
          const pts = line(detail.series[m]);
          if (pts.length < 2) return pts.map((p, i) => <circle key={`${m}${i}`} cx={p.x} cy={p.y} r="3" className={s.mDot} data-metric={m} />);
          return (
            <g key={m}>
              <path d={areaPath(pts, 148)} fill={`url(#mg-${m})`} />
              <path d={smoothPath(pts)} className={s.mLine} data-metric={m} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <Axis labels={detail.axis} />
      <ul className={s.rows}>
        {detail.rows.map((r) => (
          <MetricRowItem key={r.metric} row={r} />
        ))}
      </ul>
    </Card>
  );
}

function MetricRowItem({ row }: { row: MetricRow }) {
  const value =
    row.first == null || row.last == null
      ? row.word
      : row.word === "one scan so far"
        ? `${row.last} · one scan so far`
        : `${row.first} → ${row.last} · ${row.word}`;
  return (
    <li className={s.row}>
      <span className={s.rowIcon}>
        <Icon name={ICON[row.metric]} size={18} />
      </span>
      <span className={s.rowLabel}>{row.label}</span>
      <span className={s.rowValue}>
        <span className="visually-hidden">{row.first != null && row.last != null && row.word !== "one scan so far" ? "First scan to latest: " : ""}</span>
        {value}
      </span>
      <span className={s.rowDot} data-metric={row.metric} aria-hidden />
    </li>
  );
}
