"use client";

import type { Suggestion } from "@/lib/story/summary";
import { Button, Card, Icon, type IconName } from "./ui";
import s from "./Suggestions.module.css";

const ICON: Record<Suggestion["icon"], IconName> = {
  science: "science",
  scan: "center_focus_weak",
  note: "edit_note",
  person: "person",
  description: "description",
};

/** "Suggestions": the first is the one we'd do next (warm card, forest button); the rest are quieter. */
export function Suggestions({ items, onAct }: { items: Suggestion[]; onAct: (s: Suggestion) => void }) {
  return (
    <div className={s.list}>
      {items.map((it, i) => (
        <Card key={it.id} variant={i === 0 ? "warm" : "glass"} className={s.card} as="article">
          <span className={s.icon}>
            <Icon name={ICON[it.icon]} size={18} />
          </span>
          <h3 className={s.title}>{it.title}</h3>
          <p className={s.body}>{it.body}</p>
          <Button kind={i === 0 ? "primary" : "secondary"} className={s.cta} onClick={() => onAct(it)}>
            {it.cta}
          </Button>
        </Card>
      ))}
    </div>
  );
}
