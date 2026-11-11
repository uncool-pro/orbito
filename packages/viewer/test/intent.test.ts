import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createIntent } from '../src/app/intent';

const state = () => {
  let value: string[] = [];
  let applied = 0;
  const intent = createIntent<string[]>((update) => {
    value = update(value);
    applied++;
  }, 60);

  return { intent, value: () => value, applied: () => applied };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createIntent', () => {
  it('a pointer that only passes changes nothing', () => {
    const s = state();

    for (let i = 0; i < 20; i++) {
      s.intent.soon((v) => [...v, `card ${i}`]);
      vi.advanceTimersByTime(30);
    }
    expect(s.applied()).toBe(0);
  });

  it('once the pointer rests, everything asked for is applied in order, in one go', () => {
    const s = state();

    s.intent.soon(() => ['a']);
    s.intent.soon((v) => [...v, 'b']);
    vi.advanceTimersByTime(60);
    expect(s.value()).toEqual(['a', 'b']);
    expect(s.applied()).toBe(1);
  });

  it('now applies at once, after what was waiting', () => {
    const s = state();

    s.intent.soon(() => ['a']);
    s.intent.now((v) => [...v, 'left']);
    expect(s.value()).toEqual(['a', 'left']);
    vi.advanceTimersByTime(100);
    expect(s.applied()).toBe(1);
  });

  it('cancel drops what was waiting', () => {
    const s = state();

    s.intent.soon(() => ['a']);
    s.intent.cancel();
    vi.advanceTimersByTime(100);
    expect(s.applied()).toBe(0);
  });
});
