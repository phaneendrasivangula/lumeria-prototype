"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Frame } from "@/lib/story/area";
import { Card, Icon } from "./ui";
import s from "./TimeLapse.module.css";

const TICK = 10; // px per tick on the scrub wheel
const PER = 5; // ticks per photo

/**
 * "Your photos": a swipeable time-lapse (scroll-snap) kept in step with the thumbnails and a scrub wheel, with the
 * day's overall score, each measure against this area's usual, the conditions, and the note the person wrote.
 * A scan whose photo didn't save keeps its place with a placeholder, so gaps are visible rather than skipped.
 */
export function TimeLapse({ frames, area, onInfo }: { frames: Frame[]; area: string; onInfo: () => void }) {
  const [i, setI] = useState(frames.length - 1);
  const [playing, setPlaying] = useState(false);
  const car = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const driver = useRef<"car" | "wheel" | "code">("code");
  const n = frames.length;
  const at = useRef(i);
  useEffect(() => {
    at.current = i;
  }, [i]);

  const jump = useCallback((k: number, smooth: boolean) => {
    const c = car.current;
    const w = wheel.current;
    driver.current = "code";
    const behavior: ScrollBehavior = smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto";
    c?.scrollTo({ left: k * c.clientWidth, behavior });
    w?.scrollTo({ left: k * TICK * PER, behavior });
    setI(k);
  }, []);

  // Start on the latest photo.
  useLayoutEffect(() => {
    const c = car.current;
    const w = wheel.current;
    driver.current = "code";
    if (c) c.scrollLeft = (n - 1) * c.clientWidth;
    if (w) w.scrollLeft = (n - 1) * TICK * PER;
  }, [n]);

  // Keep the current photo in place if the card changes size (rotation, zoom).
  useEffect(() => {
    const c = car.current;
    if (!c || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      driver.current = "code";
      c.scrollLeft = at.current * c.clientWidth;
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      const k = at.current + 1;
      if (k >= n) setPlaying(false);
      else jump(k, true);
    }, 1400);
    return () => window.clearInterval(t);
  }, [playing, n, jump]);

  const onCar = () => {
    const c = car.current;
    if (!c || !c.clientWidth) return;
    const p = c.scrollLeft / c.clientWidth;
    if (driver.current !== "car") return; // scrolls we caused ourselves already set the index
    if (wheel.current) wheel.current.scrollLeft = p * TICK * PER;
    const k = Math.round(p);
    if (k !== i && k >= 0 && k < n) setI(k);
  };
  const onWheel = () => {
    const w = wheel.current;
    if (!w) return;
    const p = w.scrollLeft / (TICK * PER);
    if (driver.current !== "wheel") return;
    if (car.current) car.current.scrollLeft = p * car.current.clientWidth;
    const k = Math.round(p);
    if (k !== i && k >= 0 && k < n) setI(k);
  };

  const f = frames[i] ?? frames[n - 1];
  if (!f) return null;
  const ticks = (n - 1) * PER + 1;

  return (
    <Card className={s.card}>
      <div className={s.head}>
        <h3 className={s.title}>Time-lapse</h3>
        <span className={s.pill} aria-hidden>
          {f.date}
          {f.place ? ` · ${f.place}` : ""}
        </span>
      </div>
      <p className="visually-hidden" aria-live="polite">
        Photo {i + 1} of {n}, {f.date}
        {f.place ? `, ${f.place}` : ""}
      </p>

      <div className={s.stage}>
        <div
          ref={car}
          className={s.carousel}
          onScroll={onCar}
          onPointerDown={() => (driver.current = "car")}
          onTouchStart={() => (driver.current = "car")}
          onWheel={() => (driver.current = "car")}
          tabIndex={0}
          role="group"
          aria-label={`${area} photos, swipe to move through time`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" && i < n - 1) jump(i + 1, true);
            if (e.key === "ArrowLeft" && i > 0) jump(i - 1, true);
          }}
        >
          {frames.map((fr) => (
            <div key={fr.scan.scan.id} className={s.slide}>
              {fr.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- scan photos come from the API as-is
                <img className={s.photo} src={fr.photo} alt={`${area} on ${fr.date}`} />
              ) : (
                <span className={s.missing}>
                  <Icon name="photo" size={28} />
                  <span>The photo from {fr.date} didn’t save.</span>
                  <span className={s.missingSub}>Its scores are still here.</span>
                </span>
              )}
            </div>
          ))}
        </div>
        {n > 1 && (
          <button
            type="button"
            className={s.play}
            aria-label={playing ? "Pause time-lapse" : "Play time-lapse"}
            onClick={() => {
              if (playing) return setPlaying(false);
              if (i === n - 1) jump(0, false);
              setPlaying(true);
            }}
          >
            <Icon name={playing ? "pause-fill" : "play_arrow-fill"} size={20} />
          </button>
        )}
      </div>

      <div className={s.detail}>
        <p className={s.overall}>
          Overall {f.overall ?? "–"}
          <button type="button" className={s.info} onClick={onInfo} aria-label="How to read your scores">
            <Icon name="info_i" size={14} />
          </button>
        </p>
        <ul className={s.tiles} aria-label="Each measure against this area’s usual">
          {f.tiles.map((t) => (
            <li key={t.label} className={s.tile}>
              <span className={s.tileLabel}>{t.label}</span>
              <span className={s.tileValue}>{t.v ?? "–"}</span>
              <span className={s.tileDelta} data-tone={t.tone}>
                {t.v == null ? "not measured" : t.d}
                {t.v != null && t.d !== "usual" && <span className="visually-hidden"> against usual</span>}
              </span>
            </li>
          ))}
        </ul>
        {f.conditions.length > 0 && (
          <ul className={s.conds} aria-label="Conditions that day">
            {f.conditions.map((c) => (
              <li key={c.t} className={s.cond} data-alert={c.alert ? "" : undefined}>
                {c.t}
              </li>
            ))}
          </ul>
        )}
        {f.note && <p className={s.note}>{f.note}</p>}
      </div>

      {n > 1 && (
        <>
          <div className={s.thumbs}>
            {frames.map((fr, k) => (
              <button
                key={fr.scan.scan.id}
                type="button"
                className={s.thumb}
                aria-pressed={k === i}
                aria-label={`Show ${fr.date}`}
                onClick={() => jump(k, true)}
              >
                <span className={s.thumbImg}>
                  {fr.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnail of the API photo
                    <img src={fr.photo} alt="" />
                  ) : (
                    <Icon name="photo" size={18} />
                  )}
                </span>
                <span className={s.thumbDate}>{fr.date}</span>
              </button>
            ))}
          </div>
          <div className={s.wheelWrap} aria-hidden>
            <div
              ref={wheel}
              className={s.wheel}
              onScroll={onWheel}
              onPointerDown={() => (driver.current = "wheel")}
              onTouchStart={() => (driver.current = "wheel")}
              onWheel={() => (driver.current = "wheel")}
            >
              {Array.from({ length: ticks }, (_, t) => (
                <span key={t} className={s.tick} data-major={t % PER === 0 ? "" : undefined} />
              ))}
            </div>
            <span className={s.needle} />
          </div>
        </>
      )}
    </Card>
  );
}
