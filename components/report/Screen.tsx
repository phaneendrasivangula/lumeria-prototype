"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TabBar, type Tab } from "./TabBar";
import { ToastProvider } from "./ui";
import s from "./Screen.module.css";

/** True once the page has scrolled past `y` px. */
export function useScrolledPast(y: number): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > y);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [y]);
  return past;
}

/**
 * One phone-width column: the soft morning wash behind the page, a pinned header that frosts over once the
 * page scrolls under it, the content, and the floating tab bar.
 */
export function Screen({ header, children, tabs }: { header?: ReactNode; children: ReactNode; tabs: { id: string; active: Tab; progressHref?: string } }) {
  const frosted = useScrolledPast(4);
  return (
    <ToastProvider>
      <div className={s.screen}>
        <div className={s.washes} aria-hidden>
          <span className={s.washTop} />
          <span className={s.washPeach} />
          <span className={s.washMint} />
          <span className={s.washRose} />
        </div>
        {header && (
          <header className={s.top} data-frosted={frosted ? "" : undefined}>
            {header}
          </header>
        )}
        <main className={s.content}>{children}</main>
      </div>
      <TabBar {...tabs} />
    </ToastProvider>
  );
}
