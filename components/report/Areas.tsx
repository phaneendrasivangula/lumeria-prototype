import type { Story } from "@/lib/insights";
import { dayNumber } from "@/lib/format";
import { Card, Icon } from "./ui";
import s from "./report.module.css";

/** Question 2: is it getting better? One card per area, each compared only with itself. */
export function Areas({ story }: { story: Story }) {
  const d0 = dayNumber(story.start);
  const span = Math.max(1, dayNumber(story.end) - d0);
  return (
    <>
      <div className={s.areas}>
        {story.areas.map((area) => {
          const pts = story.scans.filter((p) => p.scan.area === area);
          const first = pts[0].scan.scores.overall;
          const last = pts[pts.length - 1].scan.scores.overall;
          const change = last - first;
          const note =
            pts.length < 3
              ? `${pts.length} scan${pts.length > 1 ? "s" : ""} so far · needs more for a trend`
              : `${pts.length} scans · ${change === 0 ? "about the same" : `${change > 0 ? "up" : "down"} ${Math.abs(change)} since the first`}`;
          const xs = pts.map((p) => 4 + ((dayNumber(p.day) - d0) / span) * 312);
          const ys = pts.map((p) => 40 - ((p.scan.scores.overall - 30) / 60) * 36);
          const line = pts.map((_, i) => `${i ? "L" : "M"}${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
          return (
            <Card key={area} as="article">
              <div className={s.area}>
                <span className={s.areaName}>{area}</span>
                <span className={s.areaScore} aria-label={`Latest overall ${last}`}>
                  {last}
                </span>
                <span className={s.areaNote}>{note}</span>
                <svg className={s.spark} viewBox="0 0 320 44" preserveAspectRatio="none" aria-hidden>
                  {pts.length > 1 ? (
                    <path d={line} fill="none" stroke="#5f8466" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  ) : null}
                  {pts.map((p, i) => (
                    <circle key={p.scan.id} cx={xs[i]} cy={ys[i]} r={pts.length > 1 ? 2 : 4} fill="#5f8466" />
                  ))}
                </svg>
              </div>
            </Card>
          );
        })}
      </div>
      <p className={s.footnote}>
        <Icon name="info" size={16} />
        <span>Each area is compared with its own usual: a forehead and a cheek have different normal scores.</span>
      </p>
    </>
  );
}
