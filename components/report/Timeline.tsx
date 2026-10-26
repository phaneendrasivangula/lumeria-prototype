import type { StoryEvent } from "@/lib/story";
import { fmtDay } from "@/lib/format";
import { Card } from "./ui";
import s from "./Timeline.module.css";

/** What happened this month, in order: routine changes, trips and cycle. Dot colour comes from data-kind. */
export function Timeline({ events }: { events: StoryEvent[] }) {
  return (
    <Card>
      <ol className={s.timeline}>
        {events.map((e) => (
          <li key={`${e.kind}-${e.day}-${e.title}`} className={s.event} data-kind={e.kind}>
            <span className={s.eventDay}>
              {fmtDay(e.day)}
              {e.endDay && e.endDay !== e.day ? `–${fmtDay(e.endDay, { day: "numeric" })}` : ""}
            </span>
            <span>
              {e.title}
              {e.detail && <span className={s.eventDetail}>{e.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
