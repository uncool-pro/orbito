/**
 * How screens connect, seen from a feature instead of from one screen: which ways out stay in the feature, which lead to
 * other features, and which are the navigation every screen repeats (a tab bar, a menu). The full link map stays the
 * source for the prototype and the checks; this only decides what a person sees first.
 */
import { targetsOf } from './links.ts';
import type { LinkMap } from './links.ts';
import type { Flow, Page } from './model.ts';

/**
 * Targets that most screens link to: a tab bar, a side menu, a header. They are navigation, not a decision of one
 * screen, so they are shown once. A target counts when at least `share` of the screens with links point to it
 * (and never fewer than `min` screens, so a small project does not call two links a menu).
 */
export const sharedTargets = (links: LinkMap, share = 0.5, min = 3): Set<string> => {
  const sources = Object.keys(links).filter((id) => targetsOf(links, id).length > 0);
  const count = new Map<string, number>();

  for (const id of sources) for (const t of targetsOf(links, id)) count.set(t, (count.get(t) ?? 0) + 1);
  const need = Math.max(min, Math.ceil(sources.length * share));

  return new Set([...count].filter(([, n]) => n >= need).map(([t]) => t));
};

/** The feature (flow) of a page a screen belongs to: the first one that lists it. */
export const featureOf = (page: Page, id: string): Flow | undefined => page.flows.find((f) => f.screens.includes(id));

export type GroupedTargets = {
  /** In the same feature as the screen. */
  here: string[];
  /** In other features, grouped by feature, in the page's order; screens on no feature of the page go last, with no feature. */
  elsewhere: { feature?: Flow; ids: string[] }[];
  /** Shared navigation (see `sharedTargets`). */
  shared: string[];
};

/** Sorts a screen's connections (its targets, or the screens leading to it) into the three kinds a person reads differently. */
export const groupTargets = (ids: string[], { page, feature, shared }: { page?: Page; feature?: Flow; shared: Set<string> }): GroupedTargets => {
  const here: string[] = [];
  const sharedOut: string[] = [];
  const byFeature = new Map<string, string[]>();
  const loose: string[] = [];

  for (const id of ids) {
    if (shared.has(id)) sharedOut.push(id);
    else if (feature?.screens.includes(id)) here.push(id);
    else {
      const f = page ? featureOf(page, id) : undefined;

      if (f) byFeature.set(f.key, [...(byFeature.get(f.key) ?? []), id]);
      else loose.push(id);
    }
  }
  const elsewhere: GroupedTargets['elsewhere'] = (page?.flows ?? []).filter((f) => byFeature.has(f.key)).map((f) => ({ feature: f, ids: byFeature.get(f.key)! }));

  if (loose.length) elsewhere.push({ ids: loose });

  return { here, elsewhere, shared: sharedOut };
};

export type FeatureLink = { from: string; to: string; count: number };

/**
 * Links between the features of a page: how many links lead from the screens of one feature to the screens of another.
 * Shared navigation is left out, it would join everything to everything.
 */
export const featureLinks = (page: Page, links: LinkMap, shared: Set<string> = new Set()): FeatureLink[] => {
  const count = new Map<string, number>();

  for (const f of page.flows) {
    for (const id of f.screens) {
      if (featureOf(page, id)?.key !== f.key) continue;
      for (const t of targetsOf(links, id)) {
        const g = shared.has(t) ? undefined : featureOf(page, t);

        if (!g || g.key === f.key) continue;
        const key = `${f.key}\u0000${g.key}`;

        count.set(key, (count.get(key) ?? 0) + 1);
      }
    }
  }

  return [...count].map(([key, n]) => {
    const [from, to] = key.split('\u0000') as [string, string];

    return { from, to, count: n };
  });
};
