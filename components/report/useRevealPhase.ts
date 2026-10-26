"use client";

import { useCallback, useState } from "react";

/** Reports whose reveal has been seen since this page loaded. A full reload shows it again; coming back from an area page doesn't. */
const SEEN = new Set<string>();

export const revealSeen = (id: string) => SEEN.has(id);

/**
 * Where the reveal is for one report: "reveal" (up; the summary waits, hidden, underneath), "enter" (dissolving while the
 * summary rises in) or "done". `leave` starts the hand-over and runs `then` once the summary is in place.
 */
export function useRevealPhase(id: string) {
  const [phase, setPhase] = useState<"reveal" | "enter" | "done">(() => (SEEN.has(id) ? "done" : "reveal"));
  const leave = useCallback(
    (then?: () => void) => {
      SEEN.add(id);
      setPhase("enter");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(
        () => {
          setPhase("done");
          then?.();
        },
        reduce ? 0 : 900,
      );
    },
    [id],
  );
  return { phase, leave };
}
