"use client";

import { useState } from "react";
import { scaleLinear } from "@/lib/charts";
import { METRIC_COPY, fmtDay, mean, photoOf, scoreOf } from "@/lib/format";
import { evidenceSeries } from "@/lib/story/series";
import type { Finding, Story } from "@/lib/story/types";
import { EvidenceChart } from "./EvidenceChart";
import { Orb } from "./Orb";
import { Icon, MatchQuestion, Pill } from "./ui";
import s from "./EvidenceSheet.module.css";

/** "Show data": the evidence behind one finding, in the order a person would question it. */
export function EvidenceSheet({
  finding,
  story,
  start,
  end,
  onAskLumi,
}: {
  finding: Finding;
  story: Story;
  start: string;
  end: string;
  onAskLumi: () => void;
}) {
  const [match, setMatch] = useState<string | null>(null);
  const data = evidenceSeries(story, finding, start, end);
  const g = finding.groups;
  const all = g ? [...g.a.values, ...g.b.values] : [];
  const gx = scaleLinear(Math.min(...all) - 3, Math.max(...all) + 3, 6, 204);
  const metric = finding.metric;
  return (
    <div className={s.sheet}>
      {finding.confidence && (
        <div className={s.pillRow}>
          <Pill tone={finding.tone}>{finding.confidence}</Pill>
        </div>
      )}
      <h2 className={s.title}>{finding.title}</h2>
      <p className={s.sub}>{finding.sub}</p>

      {finding.causes.length > 0 && (
        <div className={s.causes} data-count={finding.causes.length}>
          {finding.causes.slice(0, 2).map((c, i) => (
            <span key={c.name} className={s.cause}>
              <Orb kind={c.kind} size={i === 0 ? "lg" : "md"} />
              <span className={s.causeName}>{c.name}</span>
              <span className={s.causeWhen}>{c.when}</span>
            </span>
          ))}
        </div>
      )}

      {data.points.length > 0 && (
        <div className={s.chart}>
          <EvidenceChart data={data} start={start} end={end} />
        </div>
      )}

      {g && g.a.values.length > 0 && g.b.values.length > 0 && (
        <>
          <hr className={s.rule} />
          <h3 className={s.h3}>{g.title}</h3>
          <dl className={s.groups}>
            {[g.a, g.b].map((grp) => (
              <div key={grp.label} className={s.group}>
                <dt className={s.groupLabel} data-tone={grp.tone}>
                  {grp.label}
                </dt>
                <dd className={s.groupDots}>
                  <svg width="210" height="16" viewBox="0 0 210 16" className={s.strip} data-tone={grp.tone} aria-hidden>
                    {grp.values.map((v, i) => (
                      <circle key={i} cx={gx(v)} cy="8" r="4.5" />
                    ))}
                    <line x1={gx(mean(grp.values))} x2={gx(mean(grp.values))} y1="-3" y2="19" />
                  </svg>
                  <span className="visually-hidden">
                    {grp.values.length} scans, average {Math.round(mean(grp.values))}
                    {metric ? ` for ${METRIC_COPY[metric].label.toLowerCase()}` : ""}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {finding.photos.length > 0 && (
        <ul className={s.photos}>
          {finding.photos.map((p) => {
            const v = metric ? scoreOf(p.scan, metric) : scoreOf(p.scan, "overall");
            return (
              <li key={p.scan.id} className={s.photo}>
                <span className={s.disc} data-focus={finding.focus?.scan.id === p.scan.id ? "" : undefined}>
                  {photoOf(p.scan) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- scan photos come from the API as-is
                    <img src={photoOf(p.scan)!} alt={`${p.scan.area} on ${fmtDay(p.day)}`} />
                  ) : (
                    <span className={s.noPhoto}>
                      <Icon name="photo" size={20} />
                      <span>No photo</span>
                    </span>
                  )}
                </span>
                <span className={s.photoDate}>{fmtDay(p.day)}</span>
                <span className={s.photoValue}>
                  {metric ? METRIC_COPY[metric].label : "Overall"} {v ?? "not measured"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <hr className={s.rule} />
      <h3 className={s.h3}>{finding.why.title}</h3>
      <p className={s.p}>{finding.why.body}</p>
      {finding.next && (
        <>
          <h3 className={`${s.h3} ${s.gap}`}>{finding.next.title}</h3>
          <p className={s.p}>{finding.next.body}</p>
        </>
      )}
      <hr className={s.rule} />
      <MatchQuestion value={match} onChange={setMatch} />
      <button type="button" className={s.ask} onClick={onAskLumi}>
        <Icon name="flare" size={18} />
        Ask Lumi about this
      </button>
    </div>
  );
}
