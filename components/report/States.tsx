import Link from "next/link";
import { arcPath } from "@/lib/charts";
import { Button, Card, Icon } from "./ui";
import s from "./States.module.css";

/** Loading: the shape of the report, with the empty dial breathing while the month is gathered. */
export function LoadingState() {
  return (
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        Gathering your month…
      </p>
      <div aria-hidden>
        <span className={`${s.sk} ${s.skPeriod}`} />
        <span className={`${s.sk} ${s.skThin}`} />
        <span className={`${s.sk} ${s.skLine1}`} />
        <span className={`${s.sk} ${s.skLine2}`} />
        <Card variant="big" className={s.dialCard}>
          <svg className={s.rings} viewBox="0 0 330 232">
            {[150, 128, 106].map((r, i) => (
              <path key={r} d={arcPath(165, 206, r, 0, 1)} strokeWidth={[15, 10, 8][i]} className={s.ring} />
            ))}
          </svg>
          <span className={`${s.sk} ${s.skScore}`} />
          <p className={s.gather}>Gathering your month…</p>
          <p className={s.moment}>This only takes a moment</p>
        </Card>
        <Card variant="big" className={s.listCard}>
          <span className={`${s.sk} ${s.skHead}`} />
          <span className={`${s.sk} ${s.skRow}`} />
          <span className={`${s.sk} ${s.skRow}`} />
        </Card>
      </div>
    </div>
  );
}

/** Error, with a retry that asks again (without ?fail=1). */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <span className={s.periodGap} aria-hidden />
      <Card variant="big" className={s.stateCard}>
        <div role="alert">
          <span className={s.badge} aria-hidden>
            <Icon name="refresh" size={26} />
          </span>
          <h2 className={s.stateTitle}>We couldn’t load your report right now.</h2>
          <p className={s.stateBody}>Your scans are safe. This is usually a connection hiccup.</p>
        </div>
        <Button kind="primary" className={s.retry} onClick={onRetry}>
          Try again
        </Button>
        <Link href="/" className={s.link}>
          Go to today’s scan
        </Link>
      </Card>
    </>
  );
}

export function NotFoundState({ what = "report" }: { what?: "report" | "area" }) {
  return (
    <>
      <span className={s.periodGap} aria-hidden />
      <Card variant="big" className={s.stateCard}>
        <span className={s.badge} aria-hidden>
          <Icon name="face" size={26} />
        </span>
        <h2 className={s.stateTitle}>{what === "report" ? "We can’t find that report." : "We can’t find that area."}</h2>
        <p className={s.stateBody}>The link may be old or mistyped. Your other reports are still here.</p>
        <Link href="/" className={`${s.retry} ${s.primaryLink}`}>
          See all reports
        </Link>
      </Card>
    </>
  );
}
