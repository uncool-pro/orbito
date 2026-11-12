import type { Page } from '@uncool-pro/orbito-core';

/** Every screen a page shows on the board: the steps of its flows and the screens of their versions. */
export const pageScreens = (page: Page): Set<string> =>
  new Set(page.flows.flatMap((f) => [...f.screens, ...(f.versions ?? []).flatMap((v) => v.screens.map((s) => s.id))]));

/**
 * The order the link probe reads the screens in: the ones in `first` (the page on screen) before all others, each group
 * in project order. `firstCount` says where the first group ends, the moment its links can be handed to the board.
 */
export const probeOrder = <S extends { id: string }>(screens: readonly S[], first?: ReadonlySet<string>) => {
  const head = first ? screens.filter((s) => first.has(s.id)) : [];

  return { order: [...head, ...screens.filter((s) => !first?.has(s.id))], firstCount: head.length };
};
