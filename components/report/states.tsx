import Link from "next/link";
import { Card, Icon, ui } from "./ui";
import s from "./states.module.css";

/** The API takes up to a second or so: show the shape of the report, not a spinner. */
export function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Gathering your month…</span>
      <div className={`${s.skeleton} ${s.skTitle}`} />
      <div className={`${s.skeleton} ${s.skLine}`} />
      <div className={`${s.skeleton} ${s.skDial}`} />
      <p className={s.loadingNote} aria-hidden>
        Gathering your month…
      </p>
      <div className={`${s.skeleton} ${s.skCard}`} />
      <div className={`${s.skeleton} ${s.skCardShort}`} />
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className={s.stateCard}>
      <div role="alert">
        <Icon name="refresh" size={28} />
        <h1 className={s.stateTitle}>We couldn’t load your report right now.</h1>
        <p className={ui.stateBody}>Your scans are safe. This is usually a connection hiccup.</p>
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
      <p className={ui.stateBody}>The link may be old or mistyped. Your other reports are still here.</p>
      <Link href="/" className={ui.primary}>
        See all reports
      </Link>
    </Card>
  );
}
