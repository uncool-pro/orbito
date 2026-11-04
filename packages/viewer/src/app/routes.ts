/**
 * The one place that knows the viewer's addresses and where to go back to.
 * Routes: `#/board[/<page>[/<flow>]]`, `#/flows[/<page>[/<flow>]]`, `#/s/<screen id or code>`, `#/ds[/<section>]`, `#/skills`.
 * Anything else is the start, which leads to the board.
 */
import { screenHash } from '@uncool-pro/orbito-runtime';

export { screenHash };

export type Mode = 'board' | 'flows' | 'prototype' | 'ds' | 'skills';
export type Canvas = 'board' | 'flows';

export type Route =
  | { view: Canvas; page?: string; flow?: string }
  | { view: 'screen'; screen: string }
  | { view: 'ds'; section?: string }
  | { view: 'skills' }
  | { view: 'start' };

const LAST_CANVAS = 'pd.lastBoard';
const BOARD = '#/board';

/** A malformed address must not break the page: the part stays as it was typed. */
const decode = (part: string) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
};

export const parseRoute = (hash: string): Route => {
  const [view, ...rest] = hash.replace(/^#\/?/, '').split('/').map(decode);

  if (view === 'board' || view === 'flows') return { view, page: rest[0] || undefined, flow: rest[1] || undefined };
  if (view === 'ds') return { view, section: rest.join('/') || undefined };
  if (view === 'skills') return { view };
  if (view === 's' && rest[0]) return { view: 'screen', screen: rest[0].replace(/\?.*$/, '') };

  return { view: 'start' };
};

export const canvasHash = (canvas: Canvas, page?: string, flow?: string) => {
  const parts = page ? [page, ...(flow ? [flow] : [])] : [];

  return [`#/${canvas}`, ...parts.map(encodeURIComponent)].join('/');
};

export const dsHash = (section?: string) => ['#/ds', ...(section ? section.split('/').map(encodeURIComponent) : [])].join('/');

export const SKILLS_HASH = '#/skills';

/** The canvas that stays in view for this mode: everything but the flows diagram leads to the board. */
export const canvasOf = (mode: Mode): Canvas => (mode === 'flows' ? 'flows' : 'board');

export const go = (hash: string) => {
  window.location.hash = hash;
};

export const openScreen = (id: string) => go(screenHash(id));

/** One click, two meanings: in the prototype it opens the screen, on a canvas it selects the screen and brings it into view. */
export const pickScreen = (mode: Mode, id: string, select: (id: string, opts: { focus: boolean }) => void) => {
  if (mode === 'prototype') openScreen(id);
  else select(id, { focus: true });
};

export const rememberCanvas = (hash: string) => {
  try {
    sessionStorage.setItem(LAST_CANVAS, hash);
  } catch {
    /* storage unavailable */
  }
};

/** Where "back" leads from the catalog, the skills map or a missing screen: the board or diagram the person came from. */
export const lastCanvasHash = () => {
  try {
    return sessionStorage.getItem(LAST_CANVAS) ?? BOARD;
  } catch {
    return BOARD;
  }
};
