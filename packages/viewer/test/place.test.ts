import { describe, expect, it } from 'vitest';

import { placeWorld } from '../src/canvas/place';

describe('placeWorld', () => {
  it('moves the world with one plain 2D transform', () => {
    const world = { style: { transform: '' } };

    placeWorld(world)({ x: 10, y: -20, k: 1.5 });
    expect(world.style.transform).toBe('translate(10px, -20px) scale(1.5)');
  });

  it('never makes the world a GPU layer: with glass in the screens a layer stutters on every frame', () => {
    const style: Record<string, string> = { transform: '' };
    const place = placeWorld({ style } as { style: { transform: string } });

    for (const c of [
      { x: 0, y: 0, k: 1 },
      { x: 40, y: 8, k: 1 },
      { x: 40, y: 8, k: 0.2 },
    ]) {
      place(c);
      expect(style.transform).not.toMatch(/translate3d|translateZ|perspective/);
      expect(style.willChange ?? '').toBe('');
    }
  });
});
