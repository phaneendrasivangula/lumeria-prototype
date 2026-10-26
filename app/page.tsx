import Link from "next/link";
import { REPORT_IDS } from "@/lib/reports";
import s from "./index.module.css";

const ABOUT: Record<string, string> = {
  noor: "One month, every field",
  maya: "11 weeks, two areas, one rough week",
  jordan: "Just signed up: one scan",
  sam: "Sparse, unsorted, several areas",
};

export default function Home() {
  return (
    <main className={s.page}>
      <h1 className={s.title}>Skin reports</h1>
      <p className={s.sub}>Open a report, or see the full interactive design.</p>
      <ul className={s.list}>
        {REPORT_IDS.map((id) => (
          <li key={id}>
            <Link href={`/report/${id}`} className={s.item}>
              <span className={s.name}>{id[0].toUpperCase() + id.slice(1)}</span>
              <span className={s.about}>{ABOUT[id] ?? ""}</span>
            </Link>
          </li>
        ))}
        <li>
          <a href="/prototype/" className={s.item}>
            <span className={s.name}>Interactive design</span>
            <span className={s.about}>Every screen and flow for Noor</span>
          </a>
        </li>
      </ul>
    </main>
  );
}
