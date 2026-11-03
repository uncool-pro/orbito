import { describe, expect, it } from 'vitest';

import { formatComments, parseComments } from '../src';
import type { ScreenComment } from '../src';

const comments: ScreenComment[] = [
  { id: 'c2', status: 'done', text: 'Rename "Add" to "Add a plant".', author: 'Ola', createdAt: '2026-11-03', note: 'renamed the button' },
  { id: 'c1', status: 'open', text: 'Too many filters on the list.\nMaybe a sheet?', author: 'Ola', createdAt: '2026-11-03' },
  { id: 'c3', status: 'doing', text: 'Bigger touch targets.', createdAt: '2026-11-04' },
];

describe('comments files', () => {
  const md = formatComments('PL-01 · List', comments);

  it('writes open ones first, then in progress, then done', () => {
    expect(md.indexOf('## open · c1')).toBeLessThan(md.indexOf('## doing · c3'));
    expect(md.indexOf('## doing · c3')).toBeLessThan(md.indexOf('## done · c2'));
    expect(md).toContain('Ola · 2026-11-03 · note: renamed the button');
  });

  it('reads back what it wrote, multi-line text, notes and a missing author', () => {
    const back = parseComments(md);

    expect(back.find((c) => c.id === 'c1')).toEqual(comments[1]);
    expect(back.find((c) => c.id === 'c2')).toEqual(comments[0]);
    expect(back.find((c) => c.id === 'c3')).toEqual(comments[2]);
  });

  it('reads a comment Claude or a person wrote by hand', () => {
    expect(parseComments('# Comments on X\n\n## open · c9\nKuba · 2026-11-05\n\nCheck the copy.\n')).toEqual([{ id: 'c9', status: 'open', text: 'Check the copy.', author: 'Kuba', createdAt: '2026-11-05' }]);
  });
});
