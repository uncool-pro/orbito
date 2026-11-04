import { describe, expect, it } from 'vitest';

import { byCreated, formatComment, parseComment } from '../src';
import type { ScreenComment } from '../src';

const done: ScreenComment = { id: 'm1a2-x7', status: 'done', text: 'Rename "Add" to "Add a plant".\nShorter is fine too.', author: 'Ola', createdAt: '2026-11-03T14:05:12Z', note: 'renamed the button' };

describe('comment files', () => {
  it('writes front matter and the text, and reads it back', () => {
    const md = formatComment(done);

    expect(md).toBe('---\nstatus: done\nauthor: Ola\ncreated: 2026-11-03T14:05:12Z\nnote: renamed the button\n---\nRename "Add" to "Add a plant".\nShorter is fine too.\n');
    expect(parseComment('m1a2-x7', md)).toEqual(done);
  });

  it('reads a comment Claude or a person wrote by hand, and leaves out what is not one', () => {
    expect(parseComment('c9', '---\nstatus: open\ncreated: 2026-11-05T09:00:00Z\n---\n\nCheck the copy.\n')).toEqual({ id: 'c9', status: 'open', text: 'Check the copy.', createdAt: '2026-11-05T09:00:00Z' });
    expect(parseComment('c9', 'Just text')).toBeNull();
    expect(parseComment('c9', '---\nstatus: closed\n---\nx')).toBeNull();
  });

  it('orders by the time they were written', () => {
    const at = (createdAt: string, id: string): ScreenComment => ({ id, status: 'open', text: '', createdAt });

    expect([at('2026-11-03T15:00:00Z', 'b'), at('2026-11-03T09:00:00Z', 'a')].sort(byCreated).map((c) => c.id)).toEqual(['a', 'b']);
  });
});
