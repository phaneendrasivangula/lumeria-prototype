"use client";

import type { RoutineItem } from "@/lib/story/summary";
import { Button, Card, Icon, Pill } from "./ui";
import s from "./Routine.module.css";

/** "Your routine": each product with what its scans say about it, or the empty state when nothing is logged. */
export function Routine({ items, onAdd, onOpen }: { items: RoutineItem[]; onAdd: () => void; onOpen: (item: RoutineItem) => void }) {
  if (!items.length) {
    return (
      <Card variant="panel" className={s.empty}>
        <h3 className={s.emptyTitle}>No routine logged yet</h3>
        <p className={s.emptyBody}>Add what you use, and your report can show what changed when you started or stopped something.</p>
        <Button className={s.emptyCta} onClick={onAdd}>
          Add your routine
        </Button>
      </Card>
    );
  }
  return (
    <Card variant="panel" className={s.card}>
      <ul className={s.list}>
        {items.map((p) => (
          <li key={p.id}>
            <button type="button" className={s.row} onClick={() => onOpen(p)} aria-label={`${p.name}: ${p.status}. ${p.detail}. Ask Lumi how it’s working.`}>
              <span className={s.thumb} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element -- small static product render */}
                <img src={p.image} alt="" width={38} height={40} />
              </span>
              <span className={s.text}>
                <span className={s.name}>{p.name}</span>
                <span className={s.detail}>{p.detail}</span>
              </span>
              <span className={s.end}>
                <Pill tone={p.tone}>{p.status}</Pill>
                <Icon name="chevron_right" size={18} className={s.chevron} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
