"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import s from "./Sheet.module.css";

/**
 * An iOS-style page sheet on the native <dialog>: showModal() traps focus and makes the page inert, Escape and a tap
 * outside close it, focus returns to the button that opened it. It slides up while the report steps back behind it,
 * and both motions are skipped under prefers-reduced-motion.
 */
export function Sheet({
  open,
  onClose,
  label,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** A centred title bar (the score guide). Without it, the header is a close button and Lumi's history/more pill. */
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const root = document.documentElement;
    if (open && !d.open) {
      root.style.setProperty("--sheet-origin", `${window.scrollY + 40}px`);
      d.showModal();
      root.dataset.sheet = "open";
      setClosing(false);
      scroller.current?.scrollTo(0, 0);
    }
    if (!open && d.open) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setClosing(true);
      delete root.dataset.sheet;
      const t = window.setTimeout(
        () => {
          d.close();
          setClosing(false);
        },
        reduce ? 0 : 340,
      );
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Never leave the page stepped back if the sheet unmounts while open.
  useEffect(() => () => void delete document.documentElement.dataset.sheet, []);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-label={label}
      data-closing={closing ? "" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={s.panel}>
        <span className={s.grabber} aria-hidden />
        {title ? (
          <div className={s.titleBar}>
            <h2 className={s.title}>{title}</h2>
            <button type="button" className={s.round} onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
        ) : (
          <div className={s.bar}>
            <button type="button" className={s.round} onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
            <span className={s.tools} aria-hidden>
              <Icon name="history" />
              <Icon name="more_horiz" />
            </span>
          </div>
        )}
        <div
          ref={scroller}
          className={s.scroll}
          tabIndex={0}
          role="region"
          aria-label={label}
          data-footer={footer ? "" : undefined}
          data-titled={title ? "" : undefined}
        >
          {(open || closing) && children}
        </div>
        {footer && (
          <>
            <span className={s.fade} aria-hidden />
            <div className={s.footer}>{footer}</div>
          </>
        )}
      </div>
    </dialog>
  );
}
