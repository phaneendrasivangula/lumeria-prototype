import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import mayaJson from "@/data/reports/maya.json";
import jordanJson from "@/data/reports/jordan.json";
import samJson from "@/data/reports/sam.json";
import type { SkinReport } from "../types";
import { buildCards } from "./cards";
import { buildSummary } from "./summary";

const cardsFor = (r: unknown) => buildCards(buildSummary(r as SkinReport));

describe("quick-insight cards", () => {
  it("tells Noor's month in four: the month, what may have helped, what lined up, and the next step", () => {
    const c = cardsFor(noorJson);
    expect(c.map((x) => x.eyebrow)).toEqual(["Sep 23 – Oct 22", "What may have helped", "What lined up", "Next"]);
    expect(c[0].value).toBe("64 → 72");
    expect(c[0].rows.map((r) => r.kind === "bar" && `${r.label} ${r.detail}`)).toEqual(["Smoother 60 → 76", "More hydrated 56 → 70", "Calmer 71 → 84"]);
    expect(c[1].title).toBe("Calmer since Oct 13");
    expect(c[1].tag?.label).toBe("Likely");
    expect(c[2].tag?.label).toBe("Can’t separate yet");
    expect(c[3].actions.at(-1)).toMatchObject({ kind: "suggestion", suggestionId: "test" });
  });

  it("works from each person's own data, and every finding card can be explained and shown", () => {
    for (const r of [mayaJson, samJson]) {
      const c = cardsFor(r);
      expect(c.length).toBeGreaterThanOrEqual(3);
      for (const card of c.slice(1, -1)) expect(card.actions.map((a) => a.label)).toEqual(["Explain", "Show data"]);
    }
  });

  it("says what slipped as plainly as what improved (Sam's tone)", () => {
    const c = cardsFor(samJson);
    expect(c[0].rows[0]).toMatchObject({ kind: "bar", label: "Less even", detail: "57 → 42", tone: "watch" });
  });

  it("has no cards for a first scan: there's no month to tell yet", () => {
    expect(cardsFor(jordanJson)).toEqual([]);
  });
});
