import { describe, expect, it } from 'vitest';

import { centerOn, fitRect, panBy, screenToWorld, visibleWorld, wheelIntent, wheelPixels, zoomAt, ZOOM } from '../src/canvas/camera';

const wheel = (p: Partial<Parameters<typeof wheelIntent>[0]>) => ({ deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, metaKey: false, shiftKey: false, ...p });

describe('zoomAt', () => {
  it('keeps the world point under the cursor fixed', () => {
    const c = { x: 120, y: -40, k: 0.7 };
    const before = screenToWorld(c, 300, 200);
    const z = zoomAt(c, 1.8, 300, 200);
    const after = screenToWorld(z, 300, 200);

    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
  });

  it('stays fixed at the limits too (no drift when clamped)', () => {
    const c = { x: 10, y: 10, k: ZOOM.max };
    const z = zoomAt(c, 4, 500, 500);

    expect(z).toEqual(c);
  });

  it('round-trips', () => {
    const c = { x: 0, y: 0, k: 1 };
    const z = zoomAt(zoomAt(c, 2, 640, 360), 0.5, 640, 360);

    expect(z.x).toBeCloseTo(0, 9);
    expect(z.k).toBeCloseTo(1, 9);
  });
});

describe('fitRect', () => {
  it('centres the content below the toolbar inset', () => {
    const c = fitRect({ x: 0, y: 0, w: 1000, h: 500 }, { w: 1200, h: 800 }, { pad: 0, inset: 100 });

    expect(c.k).toBe(1);
    expect(c.x).toBe(100);
    expect(c.y).toBe(100 + (700 - 500) / 2);
  });

  it('shrinks large content', () => {
    const c = fitRect({ x: 0, y: 0, w: 4000, h: 1000 }, { w: 1000, h: 1000 }, { pad: 0 });

    expect(c.k).toBe(0.25);
  });
});

describe('visibleWorld / centerOn / panBy', () => {
  it('sees what the camera shows', () => {
    const r = visibleWorld({ x: -100, y: -50, k: 2 }, { w: 400, h: 300 });

    expect(r).toEqual({ x: 50, y: 25, w: 200, h: 150 });
  });

  it('centres a rect', () => {
    const c = centerOn({ x: 0, y: 0, k: 1 }, { x: 100, y: 100, w: 200, h: 100 }, { w: 800, h: 600 });

    expect(screenToWorld(c, 400, 300)).toEqual({ x: 200, y: 150 });
  });

  it('pans in screen pixels', () => {
    expect(panBy({ x: 1, y: 2, k: 3 }, 10, -5)).toEqual({ x: 11, y: -3, k: 3 });
  });
});

describe('wheel', () => {
  it('pinch and Ctrl/⌘ + wheel zoom, two-finger scroll pans', () => {
    expect(wheelIntent(wheel({ ctrlKey: true, deltaY: 3 }), { wheelZooms: false })).toBe('zoom');
    expect(wheelIntent(wheel({ metaKey: true, deltaY: 100 }), { wheelZooms: false })).toBe('zoom');
    expect(wheelIntent(wheel({ deltaX: 4, deltaY: 7.5 }), { wheelZooms: true })).toBe('pan');
    expect(wheelIntent(wheel({ deltaY: 100 }), { wheelZooms: false })).toBe('pan');
  });

  it('a notched mouse wheel zooms only when preferred', () => {
    expect(wheelIntent(wheel({ deltaY: 100 }), { wheelZooms: true })).toBe('zoom');
    expect(wheelIntent(wheel({ deltaY: 3, deltaMode: 1 }), { wheelZooms: true })).toBe('zoom');
  });

  it('normalises line and page deltas, Shift scrolls sideways', () => {
    expect(wheelPixels(wheel({ deltaY: 3, deltaMode: 1 }), 800)).toEqual({ dx: 0, dy: 48 });
    expect(wheelPixels(wheel({ deltaY: 1, deltaMode: 2 }), 800)).toEqual({ dx: 0, dy: 800 });
    expect(wheelPixels(wheel({ deltaY: 40, shiftKey: true }), 800)).toEqual({ dx: 40, dy: 0 });
  });
});
