import { ICON_PATHS, type IconName } from "./icons";
import s from "./ui.module.css";

/** Material Symbols Rounded, inlined. Decorative unless given a label. `flip` turns an up arrow into a down one. */
export function Icon({ name, size = 20, label, flip, className }: { name: IconName; size?: number; label?: string; flip?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`${s.icon} ${className ?? ""}`}
      data-flip={flip ? "" : undefined}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
