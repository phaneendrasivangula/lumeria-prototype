// How a score reads at a glance. Every score is 0–100 and higher is always better,
// so one set of bands works for every metric, redness and oil balance included.
// Colours live in CSS (--band-calm / --band-dipped / --band-rough), keyed by data-band.

export type Band = "calm" | "dipped" | "rough";

export const BAND_COPY: Record<Band, { label: string; range: string; means: string }> = {
  calm: { label: "Calm", range: "68 or more", means: "Your skin was settled that day." },
  dipped: { label: "Dipped", range: "56 to 67", means: "A little more reactive than usual." },
  rough: { label: "Rough", range: "Under 56", means: "Your skin was having a harder day." },
};

/** The dial colours each scan by its redness score: the concern most people come to us with. */
export function bandOf(score: number): Band {
  if (score >= 68) return "calm";
  if (score >= 56) return "dipped";
  return "rough";
}
