"use client";

import { areaInfo } from "@/lib/areas";
import { bandOf } from "@/lib/bands";
import { arcPath } from "@/lib/charts";
import { METRICS, METRIC_COPY, addDays, firstScanWord, fmtDay, monthName, numberWord, scoreOf, scoreTone } from "@/lib/format";
import type { Summary } from "@/lib/story/summary";
import { AreaGlyph, Button, Card, Icon } from "./ui";
import s from "./FirstScan.module.css";

/**
 * The first-scan report: no trend to show yet, so it says where the person starts, what their first scan saw, and
 * what each next scan unlocks.
 */
export function FirstScan({ summary, onInfo, onPlan }: { summary: Summary; onInfo: () => void; onPlan: () => void }) {
  const p = summary.story.latest;
  const info = areaInfo(p.scan.area);
  const overall = scoreOf(p.scan, "overall");
  const band = overall == null ? "none" : bandOf(overall);
  const end = summary.period.end;
  const order: typeof METRICS = ["hydration", "redness", "pigmentation", "evenness", "oiliness"];
  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <p className={s.eyebrow}>{monthName(p.day)} · your first scan</p>
        <h2 className={s.headline}>
          Your starting point. <i>Welcome, {summary.name}.</i>
        </h2>
        <p className={s.lead}>
          {numberWord(summary.story.scans.length).replace(/^./, (c) => c.toUpperCase())} {info.noun} scan on {fmtDay(p.day)}. Every scan from here is compared
          with this one, so your report gets smarter each time.
        </p>
      </div>

      <Card variant="big" className={s.dialCard}>
        <div className={s.dial}>
          <svg viewBox="0 0 330 232" className={s.svg} role="img" aria-label={`A ring for ${fmtDay(p.day)} to ${fmtDay(end)} with one scan filled in`}>
            <defs>
              <radialGradient id="firstglow" cx="0.5" cy="1" r="0.75">
                <stop offset="0" className={s.glow1} />
                <stop offset="1" className={s.glow2} />
              </radialGradient>
            </defs>
            <ellipse cx="165" cy="206" rx="125" ry="95" fill="url(#firstglow)" />
            <path d={arcPath(165, 196, 150, 0, 1)} className={s.track} strokeWidth="20" />
            <path d={arcPath(165, 196, 150, 0.035, 0.06)} className={s.mark} data-band={band} strokeWidth="18" />
            <text x="2" y="222" className={s.axis}>
              {fmtDay(p.day)}
            </text>
            <text x="328" y="222" textAnchor="end" className={s.axis}>
              {fmtDay(end)}
            </text>
          </svg>
          <span className={s.glyph} aria-hidden>
            <AreaGlyph glyph={info.glyph} size={14} />
          </span>
          <div className={s.center}>
            <p className={s.overall}>
              Overall
              <button type="button" className={s.info} onClick={onInfo} aria-label="How to read your scores">
                <Icon name="info_i" size={14} />
              </button>
            </p>
            <p className={s.score}>{overall ?? "–"}</p>
            <p className={s.firstPill}>Your first scan</p>
          </div>
        </div>
        <p className={s.caption}>Each scan fills in a day on the ring.</p>
      </Card>

      <Card variant="big" className={s.scores}>
        <div className={s.scoresHead}>
          <h3 className={s.eyebrowMuted}>Your first scores</h3>
          <button type="button" className={s.higher} onClick={onInfo}>
            Higher is better <Icon name="info" size={14} />
          </button>
        </div>
        <ul className={s.bars}>
          {order.map((m) => {
            const v = scoreOf(p.scan, m);
            return (
              <li key={m} className={s.bar}>
                <span className={s.barTop}>
                  <span className={s.barName}>{METRIC_COPY[m].label}</span>
                  <span className={s.barWord}>
                    {firstScanWord(m, v)}
                    {v != null && (
                      <>
                        {" · "}
                        <b>{v}</b>
                      </>
                    )}
                  </span>
                </span>
                <span className={s.track2} aria-hidden>
                  {v != null && <span className={s.fill} data-tone={scoreTone(v)} style={{ "--w": `${v}%` } as React.CSSProperties} />}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card variant="big" className={s.noticed}>
        <h3 className={s.eyebrowGold}>What we noticed</h3>
        <p className={s.noticedTitle}>{p.scan.summary.headline}</p>
        <ul className={s.obs}>
          {p.scan.summary.observations.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p className={s.tip}>Try: {p.scan.summary.tip}</p>
      </Card>

      <Card variant="big" className={s.next}>
        <h3 className={s.eyebrowGold}>What unlocks next</h3>
        <ol className={s.steps}>
          <li className={s.step} data-done>
            <span className={s.num} aria-hidden>
              ✓
            </span>
            <span>
              <span className={s.stepTitle}>First scan</span>
              <span className={s.stepSub}>Done · {fmtDay(p.day)}</span>
            </span>
          </li>
          {[
            [3, "Your first trend", "2 more scans this week"],
            [7, "Why your skin changed", "Patterns from your notes and routine"],
            [30, "Your full monthly report", `Ready ${fmtDay(addDays(end, 1))}`],
          ].map(([n, t, d]) => (
            <li key={String(n)} className={s.step}>
              <span className={s.num} aria-hidden>
                {n}
              </span>
              <span>
                <span className={s.stepTitle}>{t}</span>
                <span className={s.stepSub}>
                  <span className="visually-hidden">After {n} scans: </span>
                  {d}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <Button kind="primary" className={s.plan} onClick={onPlan}>
          Plan my next 2 scans
        </Button>
      </Card>
    </div>
  );
}
