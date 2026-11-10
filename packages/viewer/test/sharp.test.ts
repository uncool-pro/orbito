import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sharpWhenStill } from '../src/canvas/sharp';

const world = () => ({ style: { willChange: '', transform: '' } });
/** Every value `willChange` takes, in order: 'auto' is the moment the browser redraws the whole world. */
const record = (w: ReturnType<typeof world>) => {
  const seen: string[] = [];
  let value = w.style.willChange;

  Object.defineProperty(w.style, 'willChange', {
    get: () => value,
    set: (v: string) => {
      value = v;
      seen.push(v);
    },
  });

  return seen;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => setTimeout(f, 16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('sharpWhenStill', () => {
  it('moves the world as one layer', () => {
    const w = world();

    sharpWhenStill(w)({ x: 10, y: 20, k: 1 });
    expect(w.style.willChange).toBe('transform');
    expect(w.style.transform).toBe('translate3d(10px, 20px, 0) scale(1)');
  });

  it('never redraws after a pan: the zoom did not change, the picture is sharp already', () => {
    const w = world();
    const seen = record(w);
    const place = sharpWhenStill(w);

    for (let i = 0; i < 5; i++) {
      place({ x: i * 40, y: 0, k: 1.5 });
      vi.advanceTimersByTime(300);
    }
    expect(seen).not.toContain('auto');
  });

  it('redraws once after a zoom, then is a layer again at the new zoom', () => {
    const w = world();
    const seen = record(w);
    const place = sharpWhenStill(w);

    place({ x: 0, y: 0, k: 1 });
    place({ x: 0, y: 0, k: 2 });
    vi.advanceTimersByTime(149);
    expect(seen).not.toContain('auto');
    vi.advanceTimersByTime(1);
    expect(w.style.willChange).toBe('auto');
    expect(w.style.transform).toBe('translate(0px, 0px) scale(2)');
    vi.advanceTimersByTime(40);
    expect(w.style.willChange).toBe('transform');
    // panning at the new zoom: no more redraws
    place({ x: 30, y: 0, k: 2 });
    vi.advanceTimersByTime(300);
    expect(seen.filter((v) => v === 'auto')).toHaveLength(1);
  });

  it('a move during the redraw wins: the layer takes the newest camera', () => {
    const w = world();
    const place = sharpWhenStill(w);

    place({ x: 0, y: 0, k: 1 });
    place({ x: 0, y: 0, k: 2 });
    vi.advanceTimersByTime(150);
    place({ x: 50, y: 5, k: 2 });
    vi.advanceTimersByTime(40);
    expect(w.style.transform).toBe('translate3d(50px, 5px, 0) scale(2)');
  });
});
