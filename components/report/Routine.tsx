import type { Product } from "@/lib/types";
import { fmtDay } from "@/lib/format";
import { Card, Pill } from "./ui";
import s from "./Routine.module.css";

/** The person's products over the period: what's in use, what stopped and why. */
export function Routine({ products, end }: { products: Product[]; end: string }) {
  return (
    <Card>
      <ul className={s.products}>
        {products.map((p) => {
          const stopped = p.endDate != null && p.endDate <= end;
          const when = stopped ? `${fmtDay(p.startDate)} – ${fmtDay(p.endDate!)}` : `since ${fmtDay(p.startDate)}`;
          return (
            <li key={p.id} className={s.product}>
              <span className={s.productName}>{p.name}</span>
              <Pill tone={stopped ? "unsure" : "neutral"}>{stopped ? "Stopped" : "In use"}</Pill>
              <span className={s.productMeta}>
                {p.usage} · {when}
                {stopped && p.stoppedReason ? ` · ${p.stoppedReason}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
