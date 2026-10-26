"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DeltaPill, Icon, useToast } from "./ui";
import s from "./TitleBar.module.css";

/**
 * The Summary's pinned title row: "Monthly Report" with the month and share buttons. Once the dial has scrolled away,
 * the title gives way to the score in miniature, so it's always in view.
 */
export function TitleBar({ title, mini }: { title: string; mini?: { score: number | null; delta: number | null; since: string; shown: boolean } }) {
  const toast = useToast();
  return (
    <div className={s.row}>
      <h1 className={s.title} data-hidden={mini?.shown ? "" : undefined}>
        {title}
      </h1>
      {mini && (
        <span className={s.mini} data-shown={mini.shown ? "" : undefined} aria-hidden>
          <span className={s.miniScore}>{mini.score ?? "–"}</span>
          {mini.delta != null && <DeltaPill delta={mini.delta} since={mini.since} />}
        </span>
      )}
      <div className={s.buttons}>
        <button type="button" aria-label="Choose a month" onClick={() => toast("Earlier months will appear here")}>
          <Icon name="calendar_month" />
        </button>
        <button
          type="button"
          aria-label="Share"
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title, url: window.location.href });
              else {
                await navigator.clipboard.writeText(window.location.href);
                toast("Link copied");
              }
            } catch {
              /* share sheet dismissed */
            }
          }}
        >
          <Icon name="ios_share" />
        </button>
      </div>
    </div>
  );
}

/** The area page's header: a back pill to the Summary, the area's name in serif, and a button to switch areas. */
export function AreaBar({ backHref, title, onAreas }: { backHref: string; title: string; onAreas: () => void }) {
  return (
    <div className={s.areaRow}>
      <Link href={backHref} className={s.back} aria-label="Back to summary">
        <Icon name="arrow_back_ios_new" size={20} />
        Summary
      </Link>
      <h1 className={s.areaTitle}>{title}</h1>
      <span className={s.areaRight}>
        <button type="button" className={s.round} aria-label="Change area" onClick={onAreas}>
          <Icon name="face" />
        </button>
      </span>
    </div>
  );
}

export function Period({ children }: { children: ReactNode }) {
  return <p className={s.period}>{children}</p>;
}
