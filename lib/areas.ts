// Body areas: how each one is named, drawn and linked. Driven only by the area string the API returns.

/** The small shape that stands for an area on the dial and the area cards. */
export type Glyph = "cheek" | "forehead" | "chin" | "limb" | "back" | "face";

export interface AreaInfo {
  name: string; // "Left cheek"
  slug: string; // "left-cheek"
  noun: string; // "cheek" (no side), for sentences like "your cheek"
  label: string; // "Cheek", for the ring label
  glyph: Glyph;
  image: string; // a neutral 3D head or body with the area marked
}

export function areaSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function areaInfo(name: string): AreaInfo {
  const n = name.toLowerCase();
  const noun = n.replace(/^(left|right|upper|lower)\s+/, "") || n;
  const pick = (glyph: Glyph, image: string) => ({ name, slug: areaSlug(name), noun, label: noun[0].toUpperCase() + noun.slice(1), glyph, image });
  if (n.includes("cheek")) return pick("cheek", "/areas/cheek.png");
  if (n.includes("forehead") || n.includes("brow")) return pick("forehead", "/areas/forehead.png");
  if (n.includes("chin")) return pick("chin", "/areas/chin.png");
  if (n.includes("jaw")) return pick("chin", "/areas/jaw.png");
  if (n.includes("arm") || n.includes("hand") || n.includes("leg")) return pick("limb", "/areas/forearm.png");
  if (n.includes("back") || n.includes("chest") || n.includes("shoulder")) return pick("back", "/areas/back.png");
  return pick("face", "/areas/face.png");
}

/** True when every area is on the face, so copy can say "your face" rather than "your skin". */
export const allOnFace = (areas: string[]) => areas.every((a) => ["cheek", "forehead", "chin", "face"].includes(areaInfo(a).glyph) || /jaw|nose/i.test(a));

export function findArea(areas: string[], slug: string): string | undefined {
  return areas.find((a) => areaSlug(a) === slug);
}
