import { describe, expect, it } from 'vitest';

import type { Page } from '@uncool-pro/orbito-core';

import { pageScreens, probeOrder } from '../src/board/probeOrder';

const screens = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

describe('probeOrder', () => {
  it('reads the screens of the page on screen first, then the rest, each in project order', () => {
    const { order, firstCount } = probeOrder(screens, new Set(['d', 'b']));

    expect(order.map((s) => s.id)).toEqual(['b', 'd', 'a', 'c', 'e']);
    expect(firstCount).toBe(2);
  });

  it('keeps the project order when no page is on screen', () => {
    const { order, firstCount } = probeOrder(screens);

    expect(order.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(firstCount).toBe(0);
  });

  it('ignores ids that are not screens of the project', () => {
    expect(probeOrder(screens, new Set(['x', 'c'])).firstCount).toBe(1);
  });
});

describe('pageScreens', () => {
  it('takes the steps of every flow and the screens of their versions, once each', () => {
    const page = {
      key: 'p',
      name: 'P',
      flows: [
        { key: 'F1', name: 'One', screens: ['list', 'detail', 'list'] },
        {
          key: 'F2',
          name: 'Two',
          screens: ['detail', 'done'],
          versions: [
            {
              key: 'v',
              name: 'V',
              date: '2026-11-11',
              state: 'open',
              screens: [{ id: 'detail-v2', replaces: 'detail' }],
            },
          ],
        },
      ],
    } as Page;

    expect([...pageScreens(page)].sort()).toEqual(['detail', 'detail-v2', 'done', 'list']);
  });
});
