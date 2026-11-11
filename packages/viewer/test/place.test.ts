import { describe, expect, it } from 'vitest';

import { placeWorld } from '../src/canvas/place';

/** A world that records what its animation is told, as a browser's element would. */
const world = () => {
  const calls: string[] = [];
  const frames: unknown[] = [];
  const style: Record<string, string> = { transform: '' };
  const animate = (() => ({
    pause: () => calls.push('pause'),
    cancel: () => calls.push('cancel'),
    effect: { setKeyframes: (k: unknown) => frames.push(k) },
  })) as unknown as HTMLElement['animate'];

  return { style: style as { transform: string }, animate, calls, frames, raw: style };
};

describe('placeWorld', () => {
  it('moves the world through a paused animation, not through its style: with glass in the screens the style stutters', () => {
    const w = world();
    const { place } = placeWorld(w);

    expect(w.calls).toEqual(['pause']);
    place({ x: 10, y: -20, k: 1.5 });
    const transform = 'translate(10px, -20px) scale(1.5)';

    expect(w.frames).toEqual([[{ transform }, { transform }]]);
    expect(w.style.transform).toBe('');
  });

  it('never asks for a kept picture of the world: it would be blurry after zooming in', () => {
    const w = world();
    const { place } = placeWorld(w);

    place({ x: 0, y: 0, k: 1 });
    place({ x: 40, y: 8, k: 6 });
    expect(JSON.stringify(w.frames)).not.toMatch(/translate3d|translateZ|perspective/);
    expect(w.raw.willChange ?? '').toBe('');
  });

  it('lets go of the world when the view goes away', () => {
    const w = world();

    placeWorld(w).release();
    expect(w.calls).toEqual(['pause', 'cancel']);
  });

  it('sets the style where animations are missing', () => {
    const style = { transform: '' };

    placeWorld({ style }).place({ x: 1, y: 2, k: 3 });
    expect(style.transform).toBe('translate(1px, 2px) scale(3)');
  });
});
