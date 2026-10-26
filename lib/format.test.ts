import { describe, expect, it } from "vitest";
import type { Scan } from "./types";
import { bandOf } from "./bands";
import { localDay, metricWord, signed , brief } from "./format";

const scan = (takenAt: string, tz?: string) => ({ takenAt, location: tz ? { tz } : undefined }) as unknown as Scan;

describe("display helpers", () => {
  it("reads every score the same way round: higher is better", () => {
    expect(bandOf(84)).toBe("calm");
    expect(bandOf(60)).toBe("dipped");
    expect(bandOf(47)).toBe("rough");
    expect(metricWord("redness", 85)).toBe("Calm");
  });

  it("says when a measure wasn't taken instead of showing 0", () => {
    expect(metricWord("oiliness", null)).toBe("Not measured");
  });

  it("puts a scan on the person's own calendar day", () => {
    // 04:08 UTC on Sep 24 is the evening of Sep 23 in San Francisco.
    expect(localDay(scan("2026-09-24T04:08:00Z", "America/Los_Angeles"))).toBe("2026-09-23");
    // Without a location we keep the timestamp's own clock rather than guess one.
    expect(localDay(scan("2026-10-20T09:30:00Z"))).toBe("2026-10-20");
  });

  it("signs changes", () => {
    expect(signed(8)).toBe("+8");
    expect(signed(-4)).toBe("-4");
    expect(signed(0)).toBe("0");
  });
});

describe("photos", () => {
  it("never shows a private scope photo, only the generated placeholder for that scan", async () => {
    const { photoOf } = await import("./format");
    const s = (photoUrl: string | null) => ({ photoUrl }) as unknown as Scan;
    expect(photoOf(s("/scans/noor_scan_01.jpg"))).toBe("/scans/noor_scan_01.svg");
    expect(photoOf(s("/mock-photos/maya_scan_01.svg"))).toBe("/mock-photos/maya_scan_01.svg");
    expect(photoOf(s(null))).toBeNull();
  });
});

describe("brief", () => {
  it("keeps the first sentence and leaves the rest to Show data", () => {
    expect(brief("Both landed the week of Oct 4. We can’t tell yet.")).toBe("Both landed the week of Oct 4.");
    expect(brief("Hydration rose 54 → 72 on your cheek since July.")).toBe("Hydration rose 54 → 72 on your cheek since July.");
    expect(brief("Redness was 76–83 on all 3.5 areas. Fine.")).toBe("Redness was 76–83 on all 3.5 areas.");
  });
});
