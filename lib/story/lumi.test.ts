import { describe, expect, it } from "vitest";
import noorJson from "@/data/reports/noor.json";
import type { SkinReport } from "../types";
import { answerFor, topicsFrom } from "./lumi";
import { buildSummary } from "./summary";

const s = buildSummary(noorJson as SkinReport);
const topics = topicsFrom(s.findings);

describe("Lumi", () => {
  it("answers from the person's own numbers", () => {
    const swap = s.findings.find((f) => f.kind === "swap")!;
    expect(swap.lumi.paras[0]).toBe("Your left cheek has averaged 76 since Oct 13, up from 56 during the retinol weeks.");
    expect(swap.lumi.stats.map((x) => x.v)).toEqual(["56", "76", "84"]);
  });

  it("matches a typed question to the closest pattern", () => {
    const a = answerFor("why is my skin so shiny lately?", topics, "Left cheek");
    expect(a.findingId).toBe("sleep");
    expect(a.script.question).toBe("why is my skin so shiny lately?");
  });

  it("points medical questions to a dermatologist instead of answering them", () => {
    const a = answerFor("Do I have rosacea?", topics, "Left cheek");
    expect(a.findingId).toBeUndefined();
    expect(a.script.title).toMatch(/dermatologist/);
    expect(a.script.paras.join(" ")).toMatch(/can’t tell you whether something is a skin condition/);
  });

  it("falls back gently when it can't tell what was asked", () => {
    expect(answerFor("hello", topics, "Left cheek").script.title).toBe("Here’s what I can help with");
  });
});
