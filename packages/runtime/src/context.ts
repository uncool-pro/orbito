import { createContext, useContext } from 'react';

/**
 * Where a screen is being rendered.
 * - `screen`: on its own page, clickable like a prototype;
 * - `board`: as a card on the board (not interactive, fixed frame size);
 * - `probe`: offscreen, once, so the board can find the links and their positions;
 * - `catalog`: a component example in the design-system catalog (links drawn, not followed);
 * - `export`: rendered to static HTML by `orbito export` (no scripts: links are plain hrefs, links to other screens are dropped).
 */
export type FrameMode = 'screen' | 'board' | 'probe' | 'catalog' | 'export';

export type FrameViewport = { key: string; width: number; height: number; kind: 'device' | 'page' };

export type FrameInfo = { mode: FrameMode; viewport: FrameViewport };

const FALLBACK: FrameInfo = { mode: 'screen', viewport: { key: 'mobile', width: 390, height: 844, kind: 'device' } };

export const FrameContext = createContext<FrameInfo>(FALLBACK);

/** For design-system frames and components that behave differently on the board (e.g. no autoplaying motion). */
export const useFrame = (): FrameInfo => useContext(FrameContext);
