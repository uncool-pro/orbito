import { describe, expect, it } from 'vitest';

import { FAR_BELOW, isFar, NEAR_FROM } from '../src/board/detail';

describe('isFar', () => {
  it('draws screens in full from a quarter of their real size up', () => {
    for (const k of [0.25, 0.3, 0.46, 1, 6]) expect(isFar(k, false)).toBe(false);
  });

  it('is far below a quarter of the real size', () => {
    for (const k of [0.24, 0.1, 0.05]) expect(isFar(k, false)).toBe(true);
  });

  it('comes back to full detail a little higher than it left, so a zoom on the edge does not flicker', () => {
    expect(NEAR_FROM).toBeGreaterThan(FAR_BELOW);
    expect(isFar(0.26, true)).toBe(true);
    expect(isFar(0.26, false)).toBe(false);
    expect(isFar(NEAR_FROM, true)).toBe(false);
  });
});
