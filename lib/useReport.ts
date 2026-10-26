"use client";

import { useCallback, useEffect, useState } from "react";
import type { SkinReport } from "./types";

export type ReportState =
  | { status: "loading" }
  | { status: "ready"; report: SkinReport }
  | { status: "not-found"; message: string }
  | { status: "error"; message: string };

/**
 * Loads a report the way a real client would: from GET /api/reports/:id.
 * `fail` passes ?fail=1 through so the error state can be reviewed; a retry always asks without it.
 */
export function useReport(id: string, fail = false): { state: ReportState; retry: () => void } {
  const [state, setState] = useState<ReportState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "loading" });
    const forceFail = fail && attempt === 0;
    fetch(`/api/reports/${encodeURIComponent(id)}${forceFail ? "?fail=1" : ""}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.status === 404) return setState({ status: "not-found", message: body.error ?? "Report not found." });
        if (!res.ok) return setState({ status: "error", message: body.error ?? `Request failed (${res.status}).` });
        setState({ status: "ready", report: body as SkinReport });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : "Network error." });
      });
    return () => ctrl.abort();
  }, [id, fail, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
