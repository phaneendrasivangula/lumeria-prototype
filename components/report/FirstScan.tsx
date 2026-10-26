import { Card, ui } from "./ui";
import s from "./FirstScan.module.css";

/** One scan is a starting point, not a trend: say so, and show what more scans unlock. */
export function FirstScan({ name, area }: { name: string; area: string }) {
  const steps = [
    { n: "✓", title: "First scan", sub: `Your ${area.toLowerCase()} baseline is set`, done: true },
    { n: "3", title: "Your first trend", sub: "2 more scans of the same area" },
    { n: "7", title: "Why your skin changed", sub: "Patterns from your notes and routine" },
    { n: "30", title: "Your full monthly report", sub: "A month of scans, in one read" },
  ];
  return (
    <Card as="article">
      <h3 className={ui.cardTitle} data-flush>
        What unlocks next, {name}
      </h3>
      <ol className={s.steps}>
        {steps.map((st) => (
          <li key={st.title} className={s.step} data-done={!!st.done}>
            <span className={s.stepNum} aria-hidden>
              {st.n}
            </span>
            <span>
              {st.title}
              <span className={s.stepSub}>{st.sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
