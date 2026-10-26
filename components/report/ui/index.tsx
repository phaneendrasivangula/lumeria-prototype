"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Glyph } from "@/lib/areas";
import type { Tone } from "@/lib/story/types";
import { Icon } from "./Icon";
import type { IconName } from "./icons";
import s from "./ui.module.css";

export { Icon } from "./Icon";
export { Sheet } from "./Sheet";
export { ToastProvider, useToast } from "./Toast";
export type { IconName };

/** The little shape that stands for an area: a dot for the cheek, a brow arc for the forehead, a jaw curve for the chin. */
export function AreaGlyph({ glyph, size = 13 }: { glyph: Glyph; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={s.glyph}>
      {glyph === "cheek" && <circle cx="12" cy="12" r="4.8" fill="currentColor" />}
      {glyph === "forehead" && <path d="M4.2 14.6 Q12 7.4 19.8 14.6" {...common} />}
      {glyph === "chin" && <path d="M6.6 8.2 C7.2 14.6 9.4 17.2 12 17.2 C14.6 17.2 16.8 14.6 17.4 8.2" {...common} />}
      {glyph === "limb" && <path d="M5 16.5 L19 7.5" {...common} />}
      {glyph === "back" && <path d="M8 5.5 V18.5 M16 5.5 V18.5" {...common} />}
      {glyph === "face" && <ellipse cx="12" cy="12" rx="5.5" ry="7" {...common} strokeWidth={2.4} />}
    </svg>
  );
}

export function GlyphChip({ glyph, size = 20 }: { glyph: Glyph; size?: 19 | 20 }) {
  return (
    <span className={s.glyphChip} data-size={size} aria-hidden>
      <AreaGlyph glyph={glyph} size={size === 19 ? 12.5 : 13} />
    </span>
  );
}

/** Confidence and status pills. Colour always comes with a word. */
export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`${s.pill} ${className ?? ""}`} data-tone={tone}>
      {children}
    </span>
  );
}

/** Small glass action ("Explain", "Show data"): 32px to look at, 44px to tap. */
export function ChipButton({ icon, children, ...rest }: { icon?: IconName; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={s.chipButton} {...rest}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

export function Button({
  kind = "secondary",
  children,
  className,
  ...rest
}: { kind?: "primary" | "secondary"; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${s.button} ${className ?? ""}`} data-kind={kind} {...rest}>
      {children}
    </button>
  );
}

export function SectionHead({ id, title, aside, sub }: { id: string; title: string; aside?: ReactNode; sub?: string }) {
  return (
    <div className={s.sectionHead}>
      <div className={s.sectionRow}>
        <h2 className={s.sectionTitle} id={id}>
          {title}
        </h2>
        {aside && <span className={s.sectionAside}>{aside}</span>}
      </div>
      {sub && <p className={s.sectionSub}>{sub}</p>}
    </div>
  );
}

export function Card({
  variant = "glass",
  className,
  children,
  as: Tag = "div",
}: {
  variant?: "glass" | "panel" | "warm" | "big";
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={`${s.card} ${className ?? ""}`} data-variant={variant}>
      {children}
    </Tag>
  );
}

/** "↑ 8 since Sep 23". Down moves read in clay with a down arrow; no change reads neutral. */
export function DeltaPill({ delta, since }: { delta: number; since: string }) {
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <span className={s.delta}>
      <span className={s.deltaPill} data-dir={dir}>
        {dir !== "flat" && <Icon name="arrow_upward" size={12} flip={dir === "down"} />}
        <span className="visually-hidden">{dir === "up" ? "up" : dir === "down" ? "down" : "no change,"}</span>
        {Math.abs(delta)}
      </span>
      <span className={s.deltaSince}>{since}</span>
    </span>
  );
}

/** Feedback on a pattern: "Does this match how your skin felt?" */
export function MatchQuestion({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <fieldset className={s.match}>
      <legend className={s.matchLegend}>Does this match how your skin felt?</legend>
      <div className={s.matchRow}>
        {["Yes", "Mostly", "Not really"].map((o) => (
          <button key={o} type="button" className={s.matchOption} aria-pressed={value === o} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
      <p className={s.matchThanks} aria-live="polite">
        {value ? "Thanks. Your answer helps the next report." : ""}
      </p>
    </fieldset>
  );
}

export function TrustNote({ children }: { children: ReactNode }) {
  return (
    <p className={s.trust}>
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}

export const ui = s;
