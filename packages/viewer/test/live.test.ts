import { describe, expect, it } from 'vitest';

import { liveCards, sameKeys } from '../src/board/live';

// a row of cards 100 wide, 50 apart: a0 at x 0, a1 at x 150, …
const row = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `a${i}`, x: i * 150, y: 0, w: 100, h: 100 }));
const at = (x: number, w: number) => ({ x, y: 0, w, h: 100 });

describe('liveCards', () => {
  it('starts the screens of the cards near the view', () => {
    expect([...liveCards(row(10), new Set(), at(300, 300), at(0, 900))]).toEqual(['a2', 'a3']);
  });

  it('on a page within the budget a screen stays for good, wherever the camera goes', () => {
    const live = liveCards(row(10), new Set(), at(300, 300), at(0, 900));
    const away = liveCards(row(10), live, at(1200, 300), at(900, 900));

    expect([...away].sort()).toEqual(['a2', 'a3', 'a8', 'a9']);
  });

  it('over the budget, keeps a live screen while its card is not far away: panning back and forth changes nothing', () => {
    const live = liveCards(row(10), new Set(), at(300, 300), at(0, 900), null, 2);
    const moved = liveCards(row(10), live, at(450, 300), at(150, 900), null, 2);

    expect([...moved]).toEqual(['a2', 'a3', 'a4']);
    expect(sameKeys(liveCards(row(10), moved, at(300, 300), at(0, 900), null, 2), moved)).toBe(true);
  });

  it('whatever is in view is live, also when that is more than the budget', () => {
    expect(liveCards(row(100), new Set(), at(0, 15000), at(0, 15000)).size).toBe(100);
  });

  it('drops the screens far from the view: what is live follows the view, not the size of the page', () => {
    const everything = new Set(row(100).map((c) => c.key));
    const live = liveCards(row(100), everything, at(3000, 300), at(2700, 900), null, 40);

    expect(live.size).toBeLessThan(8);
    expect(live.has('a0')).toBe(false);
    expect(live.has('a20')).toBe(true);
  });

  it('never drops the screen being scrolled', () => {
    const everything = new Set(row(100).map((c) => c.key));

    expect(liveCards(row(100), everything, at(3000, 300), at(2700, 900), 'a0', 40).has('a0')).toBe(true);
    expect(liveCards(row(100), everything, at(3000, 300), at(2700, 900), null, 40).has('a0')).toBe(false);
  });
});
