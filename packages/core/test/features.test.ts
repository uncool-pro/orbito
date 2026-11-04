import { describe, expect, it } from 'vitest';

import { featureLinks, groupTargets, sharedTargets } from '../src';
import type { Hotspot, LinkMap, Page } from '../src';

const to = (t: string): Hotspot => ({ to: t, label: t, trigger: 'tap', x: 0, y: 0, w: 10, h: 10, belowFold: false });
// every screen has the tab bar (home, profile); the features link to each other once or twice
const links: LinkMap = {
  home: [to('home'), to('profile'), to('list')],
  list: [to('home'), to('profile'), to('detail')],
  detail: [to('home'), to('profile'), to('edit'), to('pay')],
  edit: [to('home'), to('profile'), to('detail')],
  pay: [to('home'), to('profile'), to('done'), to('detail')],
  done: [to('home'), to('profile')],
  profile: [to('home')],
};
const page: Page = {
  key: 'shop',
  name: 'Shop',
  flows: [
    { key: 'F1', name: 'Browse', screens: ['home', 'list', 'detail'] },
    { key: 'F2', name: 'Edit', screens: ['detail', 'edit'] },
    { key: 'F3', name: 'Pay', screens: ['pay', 'done'] },
  ],
};

describe('sharedTargets', () => {
  it('finds the navigation most screens repeat', () => {
    expect([...sharedTargets(links)].sort()).toEqual(['home', 'profile']);
  });

  it('never calls a couple of links a menu in a small project', () => {
    expect(sharedTargets({ a: [to('b')], b: [to('a')] }).size).toBe(0);
  });
});

describe('groupTargets', () => {
  const shared = sharedTargets(links);

  it('keeps the feature, folds the rest by feature and shows the menu once', () => {
    const g = groupTargets(['home', 'profile', 'edit', 'pay', 'nowhere'], { page, feature: page.flows[1], shared });

    expect(g.shared).toEqual(['home', 'profile']);
    expect(g.here).toEqual(['edit']);
    expect(g.elsewhere).toEqual([{ feature: page.flows[2], ids: ['pay'] }, { ids: ['nowhere'] }]);
  });
});

describe('featureLinks', () => {
  it('counts links between features, without the shared navigation', () => {
    const out = featureLinks(page, links, sharedTargets(links));

    // detail belongs to F1 (the first feature that lists it): F1 → F2 (edit), F1 → F3 (pay); edit → detail is F2 → F1, pay → detail is F3 → F1
    expect(out).toEqual(
      expect.arrayContaining([
        { from: 'F1', to: 'F2', count: 1 },
        { from: 'F1', to: 'F3', count: 1 },
        { from: 'F2', to: 'F1', count: 1 },
        { from: 'F3', to: 'F1', count: 1 },
      ]),
    );
    expect(out).toHaveLength(4);
  });
});
