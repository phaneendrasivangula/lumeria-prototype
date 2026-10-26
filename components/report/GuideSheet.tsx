import { BAND_COPY, type Band } from "@/lib/bands";
import { Sheet, ui } from "./ui";

/** How to read the dial, and the one rule that makes every score readable: higher is always better. */
export function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How to read your score">
      <h3 className={ui.cardTitle}>Your month on one dial</h3>
      <p className={ui.body}>
        The big number is the overall score on your latest scan, out of 100: the average of your five measures. Every score is the same way
        round: higher is always better, including redness and oil balance.
      </p>
      <p className={ui.body}>
        Each ring is one area, read left to right from the first day to the last. One mark is one scan. A gap is a day without a scan, so we
        don’t guess.
      </p>
      <h3 className={ui.cardTitle} data-spaced>
        What the colours mean
      </h3>
      <dl className={ui.rows}>
        {(Object.keys(BAND_COPY) as Band[]).map((b) => (
          <div key={b} className={ui.row}>
            <dt>
              <span className={ui.swatch} data-band={b} aria-hidden />
              {BAND_COPY[b].label}
            </dt>
            <dd>{BAND_COPY[b].range}</dd>
            <span className={ui.rowNote}>{BAND_COPY[b].means} Based on that scan’s redness score.</span>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
