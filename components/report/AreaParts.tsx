"use client";

import type { AreaDetail, Rec } from "@/lib/story/area";
import { Card, DeltaPill, Icon, Pill } from "./ui";
import s from "./AreaParts.module.css";

/** The top of an area page: its 3D face, scan count and period, the big score and its change, one plain line. */
export function AreaHero({ detail }: { detail: AreaDetail }) {
  return (
    <div className={s.hero}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static illustration */}
      <img className={s.face} src={detail.info.image} alt="" width={156} height={181} />
      <p className={s.count}>{detail.countLine}</p>
      <p className={s.score}>
        {detail.score ?? "–"}
        <span className="visually-hidden"> overall on the latest scan</span>
      </p>
      <p className={s.delta}>
        {detail.delta != null ? <DeltaPill delta={detail.delta} since={detail.since} /> : <span className={s.needs}>Needs more scans</span>}
      </p>
      <p className={s.sub}>{detail.subhead}</p>
    </div>
  );
}

/** Ask Lumi: questions this area's data can answer, then an open question. */
export function AskLumi({
  questions,
  area,
  onAsk,
  onOpen,
}: {
  questions: AreaDetail["questions"];
  area: string;
  onAsk: (q: AreaDetail["questions"][number]) => void;
  onOpen: () => void;
}) {
  return (
    <Card className={s.ask}>
      <ul className={s.askList}>
        {questions.map((q) => (
          <li key={q.q}>
            <button type="button" className={s.askRow} onClick={() => onAsk(q)}>
              <Icon name="flare" size={18} className={s.askIcon} />
              <span className={s.askText}>{q.q}</span>
              <Icon name="arrow_forward" size={18} className={s.askArrow} />
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={s.askRow} onClick={onOpen}>
            <Icon name="flare" size={18} className={s.askIcon} />
            <span className={s.askText} data-muted>
              Ask about your {area.toLowerCase()}…
            </span>
            <Icon name="arrow_forward" size={18} className={s.askArrow} />
          </button>
        </li>
      </ul>
    </Card>
  );
}

/** Recommendations, only where the scans support them. */
export function Recommendations({ recs }: { recs: Rec[] }) {
  return (
    <>
      <Card className={s.recs}>
        <ul className={s.recList}>
          {recs.map((r) => (
            <li key={r.id} className={s.rec}>
              <span className={s.recImg} data-empty={r.image ? undefined : ""} aria-hidden>
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static product render
                  <img src={r.image} alt="" width={60} height={72} />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 8.75V6.25A1.5 1.5 0 0 1 8.5 4.75h7A1.5 1.5 0 0 1 17 6.25v2.5" />
                    <rect x="4.75" y="8.75" width="14.5" height="11.5" rx="2.75" />
                    <path d="M8.75 14.5h6.5" />
                  </svg>
                )}
              </span>
              <span className={s.recText}>
                <span className={s.recPill}>
                  <Pill tone={r.tone}>{r.status}</Pill>
                </span>
                <span className={s.eyebrow}>{r.eyebrow}</span>
                <span className={s.recName}>{r.name}</span>
                <span className={s.recBody}>{r.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <p className={s.recNote}>Suggestions from patterns in your scans, not a diagnosis.</p>
    </>
  );
}

/** When an area has no patterns yet, show what its latest scan saw instead. */
export function LatestScanNote({ detail }: { detail: AreaDetail }) {
  const p = detail.points[detail.points.length - 1];
  return (
    <Card className={s.latest}>
      <span className={s.latestTitle}>{p.scan.summary.headline}</span>
      {p.scan.summary.observations.map((o) => (
        <span key={o} className={s.latestObs}>
          {o}
        </span>
      ))}
      <span className={s.latestTip}>Try: {p.scan.summary.tip}</span>
    </Card>
  );
}
