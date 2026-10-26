"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/insights";
import { METRICS, METRIC_COPY, fmtScanTime, mean, metricWord, signed } from "@/lib/format";
import { Pill, Sheet, ui } from "./ui";
import s from "./report.module.css";

type Light = "ambient" | "polarized" | "uva";
const LIGHT_LABEL: Record<Light, string> = { ambient: "Visible", polarized: "Glare-free", uva: "UV" };

/** One scan in full: the photo in each light, every score against this area's usual, and the context around it. */
export function ScanSheet({ scans, index, onIndex, onClose }: { scans: DayPoint[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const p = index == null ? null : scans[index];
  return (
    <Sheet open={p != null} onClose={onClose} title={p ? `${p.scan.area} · ${fmtScanTime(p.scan)}` : "Scan"}>
      {p && index != null && <ScanBody key={p.scan.id} p={p} scans={scans} index={index} onIndex={onIndex} />}
    </Sheet>
  );
}

function ScanBody({ p, scans, index, onIndex }: { p: DayPoint; scans: DayPoint[]; index: number; onIndex: (i: number) => void }) {
  const { scan } = p;
  const [light, setLight] = useState<Light>("ambient");
  const same = scans.filter((x) => x.scan.area === scan.area && x.scan.id !== scan.id);
  const usual = (m: (typeof METRICS)[number] | "overall") => {
    const v = same.map((x) => x.scan.scores[m]).filter((n): n is number => n != null);
    return v.length >= 2 ? Math.round(mean(v)) : null;
  };
  const src = scan.photos ? scan.photos[light] : scan.photoUrl;
  const env = scan.location?.environment;
  const sleep = scan.health?.sleepHours ?? scan.checkin?.sleepHours;
  const overallUsual = usual("overall");

  return (
    <>
      <div className={s.photo}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local scan photos
          <img src={src} alt={`${scan.area} scan, ${LIGHT_LABEL[light].toLowerCase()} light`} />
        ) : (
          <p className={s.stateBody} style={{ padding: 24 }}>
            The photo for this scan didn’t upload. Your scores were still recorded.
          </p>
        )}
      </div>
      {scan.photos && (
        <div className={s.lights} role="group" aria-label="Light">
          {(Object.keys(LIGHT_LABEL) as Light[]).map((l) => (
            <button key={l} type="button" className={ui.chip} aria-pressed={light === l} onClick={() => setLight(l)}>
              {LIGHT_LABEL[l]}
            </button>
          ))}
        </div>
      )}

      <h3 className={s.todayHead} style={{ marginTop: 18 }}>
        {scan.summary.headline}
      </h3>
      <dl className={s.rows}>
        <div className={s.row}>
          <dt>Overall</dt>
          <dd>
            {scan.scores.overall}
            {overallUsual != null && ` · ${signed(scan.scores.overall - overallUsual)} vs your usual`}
          </dd>
        </div>
        {METRICS.map((m) => {
          const v = scan.scores[m];
          const u = usual(m);
          return (
            <div key={m} className={s.row}>
              <dt>{METRIC_COPY[m].label}</dt>
              <dd>{v ?? "Not measured"}</dd>
              <span className={s.rowNote}>
                {metricWord(m, v)}
                {v != null && u != null ? ` · usual ${u}` : ""}
              </span>
            </div>
          );
        })}
      </dl>

      {scan.summary.observations.length > 0 && (
        <ul className={s.list}>
          {scan.summary.observations.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
      <div className={s.tip}>
        <span>
          <b>Something to try</b>
          {scan.summary.tip}
        </span>
      </div>

      {scan.annotation?.note && <p className={s.quote}>“{scan.annotation.note}”</p>}
      <div className={s.conditions}>
        {scan.location && <Pill tone="neutral">{scan.location.city}</Pill>}
        {env && <Pill tone="neutral">UV {env.uvIndexMax}</Pill>}
        {env && <Pill tone="neutral">Humidity {env.humidityPct}%</Pill>}
        {sleep != null && <Pill tone="neutral">Slept {sleep} h</Pill>}
        {scan.health?.cycleDay != null && <Pill tone="neutral">Cycle day {scan.health.cycleDay}</Pill>}
        {scan.annotation?.tags.map((t) => (
          <Pill key={t} tone="neutral">
            {t}
          </Pill>
        ))}
      </div>

      <div className={s.sheetNav}>
        <button type="button" className={ui.chip} disabled={index === 0} onClick={() => onIndex(index - 1)}>
          ‹ Earlier
        </button>
        <button type="button" className={ui.chip} disabled={index === scans.length - 1} onClick={() => onIndex(index + 1)}>
          Later ›
        </button>
      </div>
    </>
  );
}
