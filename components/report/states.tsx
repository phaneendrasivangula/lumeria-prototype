import Link from "next/link";
import { Card, Icon, ui } from "./ui";
import s from "./report.module.css";

/** The API takes up to a second or so: show the shape of the report, not a spinner. */
export function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Gathering your month…</span>
      <div className={s.skeleton} style={{ height: 36, width: "62%", marginTop: 4 }} />
      <div className={s.skeleton} style={{ height: 14, width: "34%", marginTop: 8 }} />
      <div className={s.skeleton} style={{ height: 190, borderRadius: "190px 190px 24px 24px", marginTop: 22 }} />
      <p className={s.subhead} style={{ textAlign: "center", marginTop: 14 }} aria-hidden>
        Gathering your month…
      </p>
      <div className={s.skeleton} style={{ height: 150, marginTop: 24, borderRadius: 20 }} />
      <div className={s.skeleton} style={{ height: 110, marginTop: 12, borderRadius: 20 }} />
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className={s.stateCard}>
      <div role="alert">
        <Icon name="refresh" size={28} color="#80601f" />
        <h1 className={s.stateTitle}>We couldn’t load your report right now.</h1>
        <p className={s.stateBody}>Your scans are safe. This is usually a connection hiccup.</p>
      </div>
      <button type="button" className={ui.primary} onClick={onRetry}>
        Try again
      </button>
    </Card>
  );
}

export function NotFoundState() {
  return (
    <Card className={s.stateCard}>
      <h1 className={s.stateTitle}>We can’t find that report.</h1>
      <p className={s.stateBody}>The link may be old or mistyped. Your other reports are still here.</p>
      <Link href="/" className={ui.primary}>
        See all reports
      </Link>
    </Card>
  );
}
