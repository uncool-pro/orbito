import { afterEach, describe, expect, it, vi } from 'vitest';

import { canvasHash, canvasOf, dsHash, lastCanvasHash, parseRoute, pickScreen, rememberCanvas, screenHash } from '../src/app/routes';

afterEach(() => vi.unstubAllGlobals());

describe('parseRoute', () => {
  it('reads the board and the flows diagram with an optional page and flow', () => {
    expect(parseRoute('#/board')).toEqual({ view: 'board' });
    expect(parseRoute('#/board/web')).toEqual({ view: 'board', page: 'web' });
    expect(parseRoute('#/flows/web/checkout')).toEqual({ view: 'flows', page: 'web', flow: 'checkout' });
  });

  it('reads a screen without the query part', () => {
    expect(parseRoute('#/s/home?v=2')).toEqual({ view: 'screen', screen: 'home' });
  });

  it('keeps nested catalog sections together', () => {
    expect(parseRoute('#/ds')).toEqual({ view: 'ds' });
    expect(parseRoute('#/ds/tokens/color')).toEqual({ view: 'ds', section: 'tokens/color' });
  });

  it('treats anything else as the start', () => {
    for (const hash of ['', '#', '#/', '#/nothing', '#/s']) expect(parseRoute(hash)).toEqual({ view: 'start' });
    expect(parseRoute('#/skills')).toEqual({ view: 'skills' });
  });

  it('survives a malformed address', () => {
    expect(parseRoute('#/board/%E0%A4%A')).toEqual({ view: 'board', page: '%E0%A4%A' });
  });
});

describe('addresses', () => {
  it('reads back what it builds, also for names with spaces and Polish letters', () => {
    expect(parseRoute(canvasHash('board', 'strona główna', 'krok 1'))).toEqual({ view: 'board', page: 'strona główna', flow: 'krok 1' });
    expect(parseRoute(dsHash('tokens/kolor tła'))).toEqual({ view: 'ds', section: 'tokens/kolor tła' });
    expect(parseRoute(screenHash('ekran ł'))).toEqual({ view: 'screen', screen: 'ekran ł' });
  });

  it('builds the plain forms the links use', () => {
    expect(canvasHash('board')).toBe('#/board');
    expect(canvasHash('flows', 'web')).toBe('#/flows/web');
    expect(canvasHash('board', undefined, 'ignored')).toBe('#/board');
    expect(dsHash()).toBe('#/ds');
    expect(dsHash('health')).toBe('#/ds/health');
  });

  it('keeps the flows diagram and sends every other mode to the board', () => {
    expect(canvasOf('flows')).toBe('flows');
    for (const mode of ['board', 'prototype', 'ds', 'skills'] as const) expect(canvasOf(mode)).toBe('board');
  });
});

describe('pickScreen', () => {
  it('opens the screen in the prototype', () => {
    const location = { hash: '#/s/a' };
    const select = vi.fn();

    vi.stubGlobal('window', { location });
    pickScreen('prototype', 'b', select);
    expect(location.hash).toBe('#/s/b');
    expect(select).not.toHaveBeenCalled();
  });

  it('selects and focuses the screen on a canvas, staying where it is', () => {
    const location = { hash: '#/board/web' };
    const select = vi.fn();

    vi.stubGlobal('window', { location });
    pickScreen('board', 'b', select);
    expect(location.hash).toBe('#/board/web');
    expect(select).toHaveBeenCalledWith('b', { focus: true });
  });
});

describe('the way back', () => {
  it('returns to the remembered canvas', () => {
    const store = new Map<string, string>();

    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    expect(lastCanvasHash()).toBe('#/board');
    rememberCanvas('#/flows/web');
    expect(lastCanvasHash()).toBe('#/flows/web');
  });

  it('falls back to the board when storage is blocked', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => rememberCanvas('#/flows')).not.toThrow();
    expect(lastCanvasHash()).toBe('#/board');
  });
});
