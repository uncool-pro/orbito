import { describe, expect, it } from 'vitest';

import { BUILT_IN_VIEWPORTS, computeFlowGraph } from '../src';
import type { Hotspot, LinkMap, Screen } from '../src';

const to = (t: string | null): Hotspot => ({ to: t, label: t ?? 'back', trigger: 'tap', x: 0, y: 0, w: 10, h: 10, belowFold: false });
const scr = (id: string): Screen => ({ id, title: id, viewport: 'mobile', file: '', component: null });
const ids = ['list', 'detail', 'done', 'error', 'orphan', 'stuck'];
const screens = new Map(ids.map((id) => [id, scr(id)]));
const links: LinkMap = {
  list: [to('detail')],
  detail: [to('done'), to('error'), to(null)],
  done: [to('list')],
  error: [to('detail')],
  orphan: [to('list')],
  stuck: [],
};
const flows = [
  { key: 'H', name: 'happy', screens: ['list', 'detail', 'done'] },
  { key: 'N', name: 'neg', path: 'negative' as const, screens: ['detail', 'error', 'stuck'] },
];

describe('computeFlowGraph', () => {
  const g = computeFlowGraph({ scope: ids, flows, links, screens, viewports: BUILT_IN_VIEWPORTS });

  it('types edges by the flows they belong to', () => {
    const kind = (a: string, b: string) => g.edges.find((e) => e.from === a && e.to === b)?.kind;

    expect(kind('list', 'detail')).toBe('happy');
    expect(kind('detail', 'error')).toBe('negative');
    expect(kind('done', 'list')).toBe('other');
  });

  it('finds dead ends, unreachable screens and flow steps without a link', () => {
    expect(g.deadEnds).toEqual(['stuck']);
    expect(g.unreachable.sort()).toEqual(['orphan', 'stuck']);
    expect(g.missingSteps).toEqual([{ flow: 'N', from: 'error', to: 'stuck' }]);
  });

  it('lays screens out by distance from the entry, going back drawn below', () => {
    const lvl = Object.fromEntries(g.nodes.map((n) => [n.id, n.level]));

    expect(lvl.list).toBe(0);
    expect(lvl.detail).toBe(1);
    expect(lvl.done).toBe(2);
    expect(g.edges.find((e) => e.from === 'done' && e.to === 'list')?.back).toBe(true);
    expect(g.nodes.find((n) => n.id === 'list')?.entry).toBe(true);
  });

  it('keeps links that leave the scope as exits', () => {
    const part = computeFlowGraph({ scope: ['list', 'detail'], flows, links, screens, viewports: BUILT_IN_VIEWPORTS });

    expect(part.exits.detail?.sort()).toEqual(['done', 'error']);
    expect(part.edges).toHaveLength(1);
  });
});
