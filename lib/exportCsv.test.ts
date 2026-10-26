import { describe, expect, it } from "vitest";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "./types";
import { reportCsv } from "./exportCsv";

describe("export", () => {
  it("writes one sorted row per scan and leaves unmeasured values empty", () => {
    const rows = reportCsv(samJson as SkinReport).split("\n");
    expect(rows[0]).toBe("date,area,overall,redness,hydration,texture,tone,oil_balance,note");
    expect(rows).toHaveLength(10);
    expect(rows[1].startsWith("2026-08-30,Right forearm,65,76,63,65,57,,")).toBe(true);
  });
});
