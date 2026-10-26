import type { TimelineItem } from "@/lib/story/summary";
import { Card } from "./ui";
import s from "./Timeline.module.css";

/** "What happened": routine changes, trips, cycle starts, or (with little logged) the month's own milestones. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <Card className={s.card}>
      <ol className={s.list}>
        {items.map((it, i) => (
          <li key={`${it.day}${it.title}`} className={s.item} data-dot={it.dot} data-next={items[i + 1]?.dot ?? "end"}>
            <span className={s.dot} aria-hidden />
            <span className={s.date}>{it.label}</span>
            <span className={s.what}>
              <span className={s.title}>{it.title}</span>
              <span className={s.detail}>{it.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
