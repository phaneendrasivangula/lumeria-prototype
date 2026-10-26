import { BAND_COPY, type Band } from "@/lib/bands";
import { METRICS, METRIC_COPY, fmtDay } from "@/lib/format";
import type { DialModel } from "@/lib/story/dial";
import { Dial } from "./Dial";
import { AreaGlyph } from "./ui";
import s from "./GuideSheet.module.css";

const ORDER = ["Outer ring", "Middle", "Inner", "Innermost"];

/** "How to read your score": the dial explained with the person's own rings, then the colours and the measures. */
export function GuideSheet({ dial, score, start, end }: { dial: DialModel; score: number | null; start: string; end: string }) {
  const rings = dial.rings;
  return (
    <div className={s.guide}>
      <h3 className={s.h3}>Your {rings.length > 1 || dial.dots ? "month" : "scan"} on one dial</h3>
      <p className={s.p}>
        {score != null
          ? `${score} is the average of your five scores on your latest scan, out of 100.`
          : "The centre is the average of your five scores on your latest scan, out of 100."}{" "}
        Higher is always better.
      </p>
      <div className={s.dial}>
        <Dial model={dial} score={score} delta={null} since="" label="Your dial, as on the report" decorative />
        <span className={s.dates} aria-hidden>
          <span>{fmtDay(start)}</span>
          <span>{fmtDay(end)}</span>
        </span>
      </div>
      <ul className={s.legend}>
        {rings.map((r, i) => (
          <li key={r.area}>
            <span className={s.key}>
              <AreaGlyph glyph={r.glyph} size={12.5} />
            </span>
            {rings.length === 1 ? "The ring" : i === rings.length - 1 && i > 0 ? "Inner" : ORDER[i]} · {r.area.toLowerCase()}
          </li>
        ))}
        {dial.products.length > 0 && (
          <li>
            <span className={s.key} data-num>
              {rings.length + 1}
            </span>
            Inner line · products
          </li>
        )}
        <li>
          <span className={s.key} data-num>
            {rings.length + (dial.products.length ? 2 : 1)}
          </span>
          Overall score
        </li>
      </ul>
      <p className={s.p}>
        Each ring starts with its area’s shape: a brow arc for the forehead, a dot for the cheek, a jaw curve for the chin. You’ll see the same shapes on your
        area cards. Read each ring left to right, {fmtDay(start)} to {fmtDay(end)}. One mark is one scan.
      </p>

      <h3 className={`${s.h3} ${s.gap}`}>What the colours mean</h3>
      <ul className={s.bands}>
        {(Object.keys(BAND_COPY) as Band[]).map((b) => (
          <li key={b}>
            <span className={s.swatch} data-band={b} aria-hidden />
            <span>
              <span className={s.bandName}>{BAND_COPY[b].label}</span>
              <span className={s.bandText}>
                {b === "calm" ? `A scan scored ${BAND_COPY[b].range} on ${METRIC_COPY[dial.metric].label.toLowerCase()}. ` : `${BAND_COPY[b].range}. `}
                {BAND_COPY[b].means}
              </span>
            </span>
          </li>
        ))}
        <li>
          <span className={s.swatch} data-band="none" aria-hidden />
          <span>
            <span className={s.bandName}>No scan</span>
            <span className={s.bandText}>A gap in the ring. Nothing was recorded, so we don’t guess.</span>
          </span>
        </li>
      </ul>

      <h3 className={`${s.h3} ${s.gap}`}>Every score, higher is better</h3>
      <ul className={s.bands}>
        {METRICS.map((m) => (
          <li key={m}>
            <span>
              <span className={s.bandName}>{METRIC_COPY[m].label}</span>
              <span className={s.bandText}>{METRIC_COPY[m].means}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
