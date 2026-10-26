"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/story";
import { fmtDay } from "@/lib/format";
import { ui } from "./ui";
import s from "./ScanStrip.module.css";

/** Question 3: what's behind the numbers? Every scan, newest first, filterable by area. */
export function ScanStrip({ scans, areas, onOpen }: { scans: DayPoint[]; areas: string[]; onOpen: (p: DayPoint) => void }) {
  const [area, setArea] = useState<string | null>(null);
  const shown = [...scans].reverse().filter((p) => !area || p.scan.area === area);
  return (
    <>
      {areas.length > 1 && (
        <div className={s.filters} role="group" aria-label="Filter by area">
          <button type="button" className={ui.chip} aria-pressed={area === null} onClick={() => setArea(null)}>
            All
          </button>
          {areas.map((a) => (
            <button key={a} type="button" className={ui.chip} aria-pressed={area === a} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
      )}
      <div className={s.strip}>
        {shown.map((p) => (
          <button
            key={p.scan.id}
            type="button"
            className={s.thumb}
            onClick={() => onOpen(p)}
            aria-label={`${p.scan.area}, ${fmtDay(p.day)}, overall ${p.scan.scores.overall}`}
          >
            <span className={s.thumbImg}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG placeholders; next/image adds nothing here */}
              {p.scan.photoUrl && <img src={p.scan.photoUrl} alt="" loading="lazy" />}
              <span className={s.thumbScore}>{p.scan.scores.overall}</span>
            </span>
            <span className={s.thumbDate}>{fmtDay(p.day)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
