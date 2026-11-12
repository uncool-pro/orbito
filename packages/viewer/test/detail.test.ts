import { describe, expect, it } from 'vitest';

import { FAR_BELOW, isFar, NEAR_FROM } from '../src/board/detail';

describe('isFar', () => {
  it('draws screens in full from half their real size up', () => {
    expect(FAR_BELOW).toBe(0.5);
    for (const k of [0.5, 0.6, 1, 6]) expect(isFar(k, false)).toBe(false);
  });

  it('is far below half the real size', () => {
    for (const k of [0.49, 0.3, 0.05]) expect(isFar(k, false)).toBe(true);
  });

  it('comes back to full detail a little higher than it left, so a zoom on the edge does not flicker', () => {
    expect(NEAR_FROM).toBeGreaterThan(FAR_BELOW);
    expect(isFar(0.52, true)).toBe(true);
    expect(isFar(0.52, false)).toBe(false);
    expect(isFar(NEAR_FROM, true)).toBe(false);
  });
});
