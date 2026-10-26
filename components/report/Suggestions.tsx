"use client";

import { brief } from "@/lib/format";
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

/** "Suggestions", in one card: the one we'd do next leads with its button; the others are quieter rows under it. */
export function Suggestions({ items, onAct }: { items: Suggestion[]; onAct: (s: Suggestion) => void }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <Card variant="warm" className={s.card} as="article">
      <span className={s.icon}>
        <Icon name={ICON[lead.icon]} size={18} />
      </span>
      <h3 className={s.title}>{lead.title}</h3>
      <p className={s.body}>{brief(lead.body)}</p>
      <Button kind="primary" className={s.cta} onClick={() => onAct(lead)}>
        {lead.cta}
      </Button>
      {rest.length > 0 && (
        <ul className={s.rows}>
          {rest.map((it) => (
            <li key={it.id}>
              <button type="button" className={s.row} onClick={() => onAct(it)}>
                <span className={s.rowIcon}>
                  <Icon name={ICON[it.icon]} size={20} />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowTitle}>{it.title}</span>
                  <span className={s.rowCta}>{it.cta}</span>
                </span>
                <Icon name="chevron_right" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
