"use client";

import type { Finding } from "@/lib/story/types";
import { Button, Card, ChipButton, Pill } from "./ui";
import s from "./Highlights.module.css";

/** The headline under the dial: two halves, the second one set slightly apart, and one plain sentence under it. */
export function Headline({ headline, subhead }: { headline: [string, string]; subhead: string }) {
  return (
    <div className={s.story}>
      <h2 className={s.headline}>
        {headline[0]} <span className={s.tail}>{headline[1]}</span>
      </h2>
      <p className={s.subhead}>{subhead}</p>
    </div>
  );
}

/** The top insight: the one finding the month turns on, with Explain (Lumi) and Show data. */
export function TopInsight({ finding, onExplain, onShowData }: { finding: Finding; onExplain: () => void; onShowData: () => void }) {
  const labelled = finding.kind === "trend";
  return (
    <Card variant="warm" className={s.top} as="section">
      {labelled && (
        <Pill tone={finding.tone} className={s.topPill}>
          Top insight · {finding.confidence}
        </Pill>
      )}
      <h2 className={s.topTitle} data-labelled={labelled ? "" : undefined}>
        {finding.title}
      </h2>
      <p className={s.topBody}>{finding.body}</p>
      <div className={s.actions}>
        <ChipButton icon="flare" onClick={onExplain}>
          Explain
        </ChipButton>
        <ChipButton icon="description" onClick={onShowData}>
          Show data
        </ChipButton>
      </div>
    </Card>
  );
}

/** "Welcome back": when the last scan is weeks older than the report. */
export function WelcomeBack({ title, body, cta, onCta }: { title: string; body: string; cta: string; onCta: () => void }) {
  return (
    <Card variant="warm" className={s.welcome} as="section">
      <p className={s.eyebrow}>Welcome back</p>
      <h2 className={s.welcomeTitle}>{title}</h2>
      <p className={s.topBody}>{body}</p>
      <Button kind="primary" className={s.welcomeCta} onClick={onCta}>
        {cta}
      </Button>
    </Card>
  );
}
