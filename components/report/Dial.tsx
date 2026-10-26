import type { Story } from "@/lib/insights";
import { dayNumber, fmtDay } from "@/lib/format";
import { BAND_COLOR, bandOf } from "@/lib/bands";
import { Icon } from "./ui";
import s from "./report.module.css";

const W = 362;
const CX = W / 2;
const CY = 176;
const RINGS = 3;

function arc(r: number, a0: number, a1: number) {
  const p = (a: number) => `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
}

/**
 * The month on one dial: one ring per area (most-scanned outside), read left to right from the first day
 * to the last. One mark is one scan, coloured by how calm that scan was. Gaps are days without a scan.
 */
export function Dial({ story, onInfo }: { story: Story; onInfo: () => void }) {
  const areas = story.areas.slice(0, RINGS);
  const d0 = dayNumber(story.start);
  const span = Math.max(1, dayNumber(story.end) - d0);
  const step = Math.PI / (span + 1);

  const first = story.primary[0];
  const last = story.primary[story.primary.length - 1];
  const now = last.scan.scores.overall;
  const change = now - first.scan.scores.overall;
  const isFirst = story.shape === "first";

  return (
    <div className={s.dialWrap}>
      <svg className={s.dial} viewBox={`0 0 ${W} 196`} role="img" aria-label={`${story.scans.length} scans across ${areas.join(", ")}, ${fmtDay(story.start)} to ${fmtDay(story.end)}`}>
        {areas.map((area, i) => {
          const r = 168 - i * 24;
          const w = 13 - i * 2;
          return (
            <g key={area}>
              <path d={arc(r, Math.PI, 2 * Math.PI)} fill="none" stroke="#ede6da" strokeWidth={w} strokeLinecap="round" />
              {story.scans
                .filter((p) => p.scan.area === area)
                .map((p) => {
                  const f = (dayNumber(p.day) - d0) / span;
                  const a = Math.PI + Math.min(1, Math.max(0, f)) * Math.PI;
                  const h = Math.max(step * 0.62, 0.03);
                  const len = r * h;
                  return (
                    <path
                      key={p.scan.id}
                      className={s.mark}
                      d={arc(r, Math.max(Math.PI, a - h / 2), Math.min(2 * Math.PI, a + h / 2))}
                      fill="none"
                      stroke={BAND_COLOR[bandOf(p.scan.scores.redness)]}
                      strokeWidth={w - 2}
                      strokeDasharray={len}
                      style={{ ["--len" as string]: len, ["--d" as string]: `${120 + i * 150 + f * 620}ms` }}
                    />
                  );
                })}
            </g>
          );
        })}
        <text x={6} y={194} fontSize={12} fill="#706860">
          {fmtDay(story.start)}
        </text>
        <text x={W - 6} y={194} fontSize={12} fill="#706860" textAnchor="end">
          {fmtDay(story.end)}
        </text>
      </svg>

      <div className={s.score}>
        <span className={s.scoreNum} aria-label={`Overall ${now} out of 100`}>
          {now}
        </span>
        <button type="button" className={s.scoreInfo} onClick={onInfo} aria-label="How to read your score">
          <span>
            <Icon name="info" size={16} />
          </span>
        </button>
        <div className={s.delta}>
          {isFirst ? (
            <span>Your first scan · {story.primaryArea.toLowerCase()}</span>
          ) : (
            <>
              <span className={s.deltaChip} data-down={change < 0}>
                <Icon name={change < 0 ? "arrowDown" : "arrowUp"} size={14} />
                {Math.abs(change)}
              </span>
              <span>since {fmtDay(first.day)}</span>
            </>
          )}
        </div>
      </div>

      <ul className={s.legend} aria-label="Rings">
        {areas.map((a, i) => (
          <li key={a}>{["Outer", "Middle", "Inner"][i]} · {a.toLowerCase()}</li>
        ))}
      </ul>
    </div>
  );
}
