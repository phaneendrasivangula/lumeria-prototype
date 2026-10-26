import type { DayPoint } from "@/lib/insights";
import { METRICS, METRIC_COPY, fmtScanTime } from "@/lib/format";
import { Card, Icon } from "./ui";
import s from "./report.module.css";

/** Question 1: how is my skin today? The latest scan, what we saw, and one thing to try. */
export function TodayCard({ latest, onOpen }: { latest: DayPoint; onOpen: () => void }) {
  const { scan } = latest;
  return (
    <Card as="article">
      <span className={s.todayMeta}>
        Latest scan · {fmtScanTime(scan)} · {scan.area}
      </span>
      <h3 className={s.todayHead}>{scan.summary.headline}</h3>
      {scan.summary.observations.length > 0 && (
        <ul className={s.list}>
          {scan.summary.observations.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
      <div className={s.tip}>
        <Icon name="flare" size={18} />
        <span>
          <b>Something to try</b>
          {scan.summary.tip}
        </span>
      </div>
      <div className={s.metrics} role="list" aria-label="Scores on this scan">
        {METRICS.map((m) => (
          <div key={m} className={s.metric} role="listitem">
            <span>{METRIC_COPY[m].label}</span>
            <strong>{scan.scores[m] ?? "–"}</strong>
          </div>
        ))}
      </div>
      <button type="button" className={s.linkBtn} onClick={onOpen}>
        See this scan in detail
        <Icon name="chevron" size={18} />
      </button>
    </Card>
  );
}
