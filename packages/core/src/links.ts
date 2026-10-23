/**
 * A link found in a rendered screen: an element marked `data-pd-to` (or `data-pd-back`).
 * Positions are in the screen's own pixels (frame coordinates, before any board scaling), so the board can start
 * an arrow at the element that triggers it.
 */
export type Hotspot = {
  /** Target screen id; `null` for a back link. */
  to: string | null;
  /** What the element says (aria-label or text), shown on the arrow. */
  label: string;
  /** Interaction that triggers it (`tap` by default; `swipe`, `long-press`, `auto` ...). */
  trigger: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The element sits below the first screenful (reachable by scrolling). */
  belowFold: boolean;
};

/** Hotspots of every probed screen, by screen id. */
export type LinkMap = Record<string, Hotspot[]>;

/** Distinct forward targets of a screen, in the order they appear (top to bottom). */
export const targetsOf = (links: LinkMap, id: string): string[] => {
  const out: string[] = [];

  [...(links[id] ?? [])]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .forEach((h) => {
      if (h.to && h.to !== id && !out.includes(h.to)) out.push(h.to);
    });

  return out;
};
