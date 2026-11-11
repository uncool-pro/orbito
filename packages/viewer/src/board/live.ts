import { intersects } from '../canvas/camera';
import type { Rect } from '../canvas/camera';

/** How many live screens a board keeps without thinking about it. Over that, the ones far from the view are dropped. */
export const LIVE_BUDGET = 150;

/**
 * Which cards show their live screen. A card gets one when it comes near the view (`near`: the view and a margin).
 *
 * On a page within the budget a screen then stays for good: nothing is ever dropped or started twice, the board
 * behaves as it always did. On a bigger page the screens far from the view (outside `far`, a wider margin than `near`,
 * so panning back and forth over the same cards changes nothing) are dropped once there are more live screens than the
 * budget: what is live, and the memory it takes, follows what the person is looking at, not the size of the page.
 * Whatever is in view is live, however many that is. `always` (the screen being scrolled) is never dropped.
 */
export const liveCards = <C extends Rect & { key: string }>(
  cards: readonly C[],
  live: ReadonlySet<string>,
  near: Rect,
  far: Rect,
  always?: string | null,
  budget = LIVE_BUDGET,
): Set<string> => {
  const wanted = cards.filter((c) => c.key === always || intersects(live.has(c.key) ? far : near, c));
  const kept = cards.filter((c) => live.has(c.key));
  const all = new Set([...kept, ...wanted].map((c) => c.key));

  return all.size <= budget ? all : new Set(wanted.map((c) => c.key));
};

export const sameKeys = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((k) => b.has(k));
