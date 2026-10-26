import type { Product } from "@/lib/types";
import { fmtDay } from "@/lib/format";
import { Card, Pill } from "./ui";
import s from "./report.module.css";

export function Routine({ products, end }: { products: Product[]; end: string }) {
  return (
    <Card>
      <ul className={s.products}>
        {products.map((p) => {
          const stopped = p.endDate != null && p.endDate <= end;
          return (
            <li key={p.id} className={s.product}>
              <span className={s.productName}>{p.name}</span>
              <Pill tone={stopped ? "unsure" : "neutral"}>{stopped ? "Stopped" : "In use"}</Pill>
              <span className={s.productMeta}>
                {p.usage} · {stopped ? `${fmtDay(p.startDate)} – ${fmtDay(p.endDate!)}` : `since ${fmtDay(p.startDate)}`}
                {stopped && p.stoppedReason ? ` · ${p.stoppedReason}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
