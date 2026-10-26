import type { SkinReport } from "./types";
import { localDay, scoreOf } from "./format";

/** Every scan as CSV rows, for "Export report": one file a dermatologist can open. Missing values stay empty. */
export function reportCsv(report: SkinReport): string {
  const head = ["date", "area", "overall", "redness", "hydration", "texture", "tone", "oil_balance", "note"];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [...report.scans]
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
    .map((s) =>
      [
        localDay(s),
        s.area,
        ...(["overall", "redness", "hydration", "evenness", "pigmentation", "oiliness"] as const).map((k) => String(scoreOf(s, k) ?? "")),
        s.annotation?.note ?? "",
      ]
        .map(esc)
        .join(","),
    );
  return [head.join(","), ...rows].join("\n");
}
