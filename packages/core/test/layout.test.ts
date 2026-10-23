import { describe, expect, it } from 'vitest';

import { BUILT_IN_VIEWPORTS, cardSize, computeLayout, G, loadProject } from '../src';
import type { Hotspot, LinkMap, Screen } from '../src';

const spot = (to: string, y = 100): Hotspot => ({ to, label: to, trigger: 'tap', x: 10, y, w: 100, h: 40, belowFold: false });
const screen = (id: string, viewport = 'mobile'): Screen => ({ id, title: id, code: id.toUpperCase(), viewport, file: `screens/${id}.screen.tsx`, component: null });
const ids = ['a', 'b', 'c', 'd'];
const screens = new Map(ids.map((id) => [id, screen(id)]));
const base = { screens, viewports: BUILT_IN_VIEWPORTS };

describe('computeLayout', () => {
  it('places cards left to right after the lane label', () => {
    const l = computeLayout({ ...base, flows: [{ key: 'F1', name: 'f', screens: ['a', 'b', 'c'] }], links: {} });
    const w = cardSize(BUILT_IN_VIEWPORTS.mobile).w;

    expect(l.cards.map((c) => c.x)).toEqual([G.laneLabelW, G.laneLabelW + w + G.colGap, G.laneLabelW + 2 * (w + G.colGap)]);
  });

  it('classifies arrows: neighbour, skip forward, back, outside the lane', () => {
    const links: LinkMap = { a: [spot('b'), spot('c', 300)], c: [spot('a')], b: [spot('x')] };
    const l = computeLayout({ ...base, flows: [{ key: 'F1', name: 'f', screens: ['a', 'b', 'c'] }], links });

    expect(l.edges.map((e) => `${e.kind}:${e.from}>${e.to}`).sort()).toEqual(['back:c>a', 'next:a>b', 'skip:a>c']);
    expect(l.stubs).toEqual([expect.objectContaining({ targets: ['x'] })]);
  });

  it('starts a neighbour arrow at the height of the element that triggers it', () => {
    const l = computeLayout({ ...base, flows: [{ key: 'F1', name: 'f', screens: ['a', 'b'] }], links: { a: [spot('b', 400)] } });
    const a = l.cards[0]!;
    const edge = l.edges[0]!;
    const y = Number(/^M\S+ (\S+)/.exec(edge.d)![1]);

    expect(y).toBeCloseTo(a.frame.y + (400 + 20) * a.frame.scale, 5);
  });

  it('gives overlapping skip arcs different channel levels', () => {
    const links: LinkMap = { a: [spot('c')], b: [spot('d')] };
    const l = computeLayout({ ...base, flows: [{ key: 'F1', name: 'f', screens: ids }], links });
    const ys = l.edges.map((e) => e.mid.y);

    expect(new Set(ys).size).toBe(2);
  });

  it('puts a replacing version screen under its original and new ones in free columns', () => {
    const all = new Map([...screens, ['b2', screen('b2')], ['n', screen('n')]]);
    const l = computeLayout({
      ...base,
      screens: all,
      links: {},
      flows: [{ key: 'F1', name: 'f', screens: ['a', 'b', 'c'], versions: [{ key: 'v', name: 'v', state: 'open', screens: [{ id: 'b2', replaces: 'b' }, { id: 'n', after: 'a' }] }] }],
    });
    const at = (key: string) => l.cards.find((c) => c.key.startsWith(key))!;

    expect(at('F1/v:b2').x).toBe(at('F1:b').x);
    expect(at('F1/v:n').x).toBe(at('F1:c').x); // column after `a` is taken by b2, so the next free one
    expect(l.ties).toHaveLength(1);
  });

  it('hides closed versions unless asked', () => {
    const flows = [{ key: 'F1', name: 'f', screens: ['a'], versions: [{ key: 'v', name: 'v', state: 'merged' as const, screens: [{ id: 'b', replaces: 'a' }] }] }];

    expect(computeLayout({ ...base, flows, links: {} }).lanes).toHaveLength(1);
    expect(computeLayout({ ...base, flows, links: {}, showClosedVersions: true }).lanes).toHaveLength(2);
  });

  it('sizes web cards by width and phone cards by height', () => {
    expect(cardSize(BUILT_IN_VIEWPORTS.mobile).frameH).toBe(G.deviceFrameH);
    expect(cardSize(BUILT_IN_VIEWPORTS.desktop).frameW).toBe(G.pageFrameW);
  });
});

describe('loadProject', () => {
  it('derives ids from file names and reports problems instead of throwing', () => {
    const C = () => null;
    const { project, problems } = loadProject(
      { title: 'T' },
      {
        '/screens/x/list.screen.tsx': { default: C, meta: { code: 'L-01', title: 'List' } },
        '/screens/y/list.screen.tsx': { default: C, meta: { code: 'L-02', title: 'Dup' } },
        '/screens/z/odd.screen.tsx': { default: C, meta: { code: 'l-01', title: 'Same code', viewport: 'watch' } },
        '/screens/z/nometa.screen.tsx': { default: C },
      },
      { '/flows/a.flow.ts': { default: { key: 'p', name: 'P', flows: [{ key: 'F', name: 'F', screens: ['list', 'ghost'] }] } } },
    );

    expect(project.screens.map((s) => s.id)).toEqual(['list', 'odd']);
    expect(problems.map((p) => p.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duplicate screen id "list"'),
        expect.stringContaining('code l-01 is already used'),
        expect.stringContaining('unknown viewport "watch"'),
        expect.stringContaining('no `meta` export'),
        expect.stringContaining('missing screen "ghost"'),
      ]),
    );
  });
});
