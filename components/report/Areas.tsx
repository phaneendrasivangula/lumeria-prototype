import type { DayPoint, Story } from "@/lib/story";
import { dayNumber } from "@/lib/format";
import { Card, Icon, ui } from "./ui";
import s from "./Areas.module.css";

const SPARK_W = 320;
const SPARK_H = 44;

function trendNote(pts: DayPoint[]): string {
  if (pts.length < 3) return `${pts.length} scan${pts.length > 1 ? "s" : ""} so far · needs more for a trend`;
  const change = pts[pts.length - 1].scan.scores.overall - pts[0].scan.scores.overall;
  return `${pts.length} scans · ${change === 0 ? "about the same" : `${change > 0 ? "up" : "down"} ${Math.abs(change)} since the first`}`;
}

/** Question 2: is it getting better? One card per area, each compared only with itself. */
export function Areas({ story }: { story: Story }) {
  const d0 = dayNumber(story.start);
  const span = Math.max(1, dayNumber(story.end) - d0);
  const x = (p: DayPoint) => 4 + ((dayNumber(p.day) - d0) / span) * (SPARK_W - 8);
  const y = (p: DayPoint) => SPARK_H - 4 - ((p.scan.scores.overall - 30) / 60) * (SPARK_H - 8);

  return (
    <>
      <div className={s.areas}>
        {story.areas.map((area) => {
          const pts = story.scans.filter((p) => p.scan.area === area);
          const last = pts[pts.length - 1].scan.scores.overall;
          const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
          return (
            <Card key={area} as="article">
              <div className={s.area}>
                <span className={s.areaName}>{area}</span>
                <span className={s.areaScore} aria-label={`Latest overall ${last}`}>
                  {last}
                </span>
                <span className={ui.note}>{trendNote(pts)}</span>
                <svg className={s.spark} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden>
                  {pts.length > 1 && <path d={line} vectorEffect="non-scaling-stroke" />}
                  {pts.map((p) => (
                    <circle key={p.scan.id} cx={x(p)} cy={y(p)} r={pts.length > 1 ? 2 : 4} />
                  ))}
                </svg>
              </div>
            </Card>
          );
        })}
      </div>
      <p className={ui.footnote}>
        <Icon name="info" size={16} />
        <span>Each area is compared with its own usual: a forehead and a cheek have different normal scores.</span>
      </p>
    </>
  );
}
