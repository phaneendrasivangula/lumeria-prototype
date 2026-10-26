import type { Finding, LumiScript } from "./types";

// Lumi's scripted answers. Every answer is composed from the person's own numbers (see findings.ts);
// this file only picks which one fits a typed question. Lumi explains patterns; it never diagnoses.

export interface LumiTopic {
  script: LumiScript;
  findingId?: string;
}

const WORDS: [RegExp, string[]][] = [
  [/red|calm|flush|irritat/i, ["redness"]],
  [/dry|hydrat|moist|water|tight/i, ["hydration"]],
  [/texture|rough|smooth|bump/i, ["evenness"]],
  [/spot|tone|pigment|dark|sun/i, ["pigmentation"]],
  [/oil|shine|shiny|greasy|break ?out/i, ["oiliness"]],
];

/** Picks the topic a free-text question is most likely about, or a gentle fallback. */
export function answerFor(question: string, topics: LumiTopic[], area: string): LumiTopic {
  const q = question.trim();
  const scored = topics
    .map((t) => {
      let score = 0;
      const text = `${t.script.title} ${t.script.question} ${t.script.paras.join(" ")}`.toLowerCase();
      for (const w of q
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((x) => x.length > 3))
        if (text.includes(w)) score += 1;
      for (const [re] of WORDS) if (re.test(q) && re.test(text)) score += 2;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score);
  if (scored[0] && scored[0].score >= 2) return { ...scored[0].t, script: { ...scored[0].t.script, question: q } };
  if (/diagnos|disease|eczema|rosacea|acne|cancer|melanoma|infect|prescri/i.test(q)) {
    return {
      script: {
        question: q,
        title: "That’s one for a dermatologist",
        sub: "Lumi explains patterns, not conditions",
        paras: [
          "I can’t tell you whether something is a skin condition. Your scans show how your skin is changing, not why medically.",
          "If something is new, painful, spreading or worrying you, a dermatologist is the right person to look. You can export this report to bring along.",
        ],
        stats: [],
      },
    };
  }
  return {
    script: {
      question: q,
      title: "Here’s what I can help with",
      sub: `Your ${area.toLowerCase()}`,
      paras: [
        "I can explain the patterns in this report: what changed, when, and how sure we are.",
        "Try one of the questions below, or ask about redness, hydration, texture, tone or shine.",
      ],
      stats: [],
    },
  };
}

export function topicsFrom(findings: Finding[]): LumiTopic[] {
  return findings.map((f) => ({ script: f.lumi, findingId: f.id }));
}
