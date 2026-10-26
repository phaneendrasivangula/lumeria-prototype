"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, useToast, type IconName } from "./ui";
import s from "./TabBar.module.css";

export type Tab = "today" | "report" | "progress" | "routine";

/**
 * The floating glass tab bar with the scan button beside it. It tucks in while you read (scrolling down) and comes
 * back when you scroll up or reach the end, like iOS 26 tab bars.
 */
export function TabBar({ id, active, progressHref }: { id: string; active: Tab; progressHref?: string }) {
  const toast = useToast();
  const [small, setSmall] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let travel = 0;
    const on = () => {
      const y = window.scrollY;
      const dy = y - last;
      last = y;
      travel = dy > 0 === travel > 0 ? travel + dy : dy;
      const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      if (y < 60 || atEnd || travel < -24) setSmall(false);
      else if (travel > 24) setSmall(true);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const report = `/report/${encodeURIComponent(id)}`;
  const tabs: { key: Tab; label: string; href: string; icon: IconName; on: IconName }[] = [
    { key: "today", label: "Today", href: "/", icon: "nav-today", on: "nav-today-on" },
    { key: "report", label: "Report", href: report, icon: "nav-insights", on: "nav-insights-on" },
    { key: "progress", label: "Progress", href: progressHref ?? report, icon: "nav-progress", on: "nav-progress-on" },
    { key: "routine", label: "Routine", href: `${report}#routine`, icon: "nav-routine", on: "nav-routine-on" },
  ];
  const index = tabs.findIndex((t) => t.key === active);

  return (
    <nav className={s.dock} aria-label="Main" data-small={small ? "" : undefined}>
      <div className={s.row}>
        <div className={s.pill}>
          <span className={s.glass} aria-hidden />
          <span className={s.indicator} data-index={index} aria-hidden />
          {tabs.map((t) => (
            <Link key={t.key} href={t.href} className={s.tab} aria-current={t.key === active ? "page" : undefined}>
              <Icon name={t.key === active ? t.on : t.icon} size={24} />
              <span className={s.label}>{t.label}</span>
            </Link>
          ))}
        </div>
        <button type="button" className={s.scan} aria-label="Scan" onClick={() => toast("Scanning happens in the Lumeria app")}>
          <span className={s.scanBg} aria-hidden />
          <Icon name="nav-scan" size={28} />
        </button>
      </div>
    </nav>
  );
}
