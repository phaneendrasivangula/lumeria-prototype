import type { StoryEvent } from "@/lib/insights";
import { fmtDay } from "@/lib/format";
import { Card } from "./ui";
import s from "./report.module.css";

const DOT: Record<StoryEvent["kind"], string> = {
  "product-start": "#5f8466",
  "product-stop": "#a9472c",
  trip: "#c9934f",
  cycle: "#9a6a7a",
  note: "#706860",
};

/** What happened this month, in order: routine changes, trips and cycle. */
export function Timeline({ events }: { events: StoryEvent[] }) {
  return (
    <Card>
      <ol className={s.timeline}>
        {events.map((e) => (
          <li key={`${e.kind}-${e.day}-${e.title}`} className={s.event} style={{ ["--dot" as string]: DOT[e.kind] }}>
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
