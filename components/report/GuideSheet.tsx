import { BAND_COLOR, BAND_COPY, type Band } from "@/lib/bands";
import { Sheet } from "./ui";
import s from "./report.module.css";

/** How to read the dial, and the one rule that makes every score readable: higher is always better. */
export function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How to read your score">
      <h3 className={s.todayHead}>Your month on one dial</h3>
      <p className={s.subhead}>
        The big number is the overall score on your latest scan, out of 100: the average of your five measures. Every score is the same way round:
        higher is always better, including redness and oil balance.
      </p>
      <p className={s.subhead}>Each ring is one area, read left to right from the first day to the last. One mark is one scan. A gap is a day without a scan, so we don’t guess.</p>
      <h3 className={s.todayHead} style={{ marginTop: 22 }}>
        What the colours mean
      </h3>
      <dl className={s.rows}>
        {(Object.keys(BAND_COPY) as Band[]).map((b) => (
          <div key={b} className={s.row}>
            <dt>
              <span aria-hidden style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: BAND_COLOR[b], marginRight: 8 }} />
              {BAND_COPY[b].label}
            </dt>
            <dd>{BAND_COPY[b].range}</dd>
            <span className={s.rowNote}>{BAND_COPY[b].means} Based on that scan’s redness score.</span>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
