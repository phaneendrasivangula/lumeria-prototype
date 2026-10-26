import type { Cause } from "@/lib/story/types";
import { Icon, type IconName } from "./ui";
import s from "./Orb.module.css";

const ICON: Record<Cause["kind"], IconName> = {
  product: "science",
  trip: "flight",
  sleep: "moon",
  stress: "graphic_eq",
  time: "calendar_month",
  area: "face",
};

/** A glossy sphere standing for one possible cause: a product, a trip, short nights. */
export function Orb({ kind, size }: { kind: Cause["kind"]; size: "lg" | "md" | "sm" | "xs" }) {
  return (
    <span className={s.orb} data-kind={kind} data-size={size} aria-hidden>
      {size !== "xs" && <Icon name={ICON[kind]} size={size === "lg" ? 30 : size === "md" ? 26 : 22} />}
    </span>
  );
}
