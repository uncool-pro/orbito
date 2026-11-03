// Comments on screens: `comments/<screen-id>.md`, one file per screen (format in core/src/comments.ts). Added and moved
// along on the board, read and moved along by Claude, shared through git like the mockups.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { formatComments, isCommentStatus, parseComments } from '@uncool-pro/orbito-core';

const invalid = (message, code = 400) => Object.assign(new Error(message), { code });
const MAX = 2000;
const ID = /^[\w.-]+$/;

/** Every screen's comments, by screen id. */
export const readComments = (dir) => {
  if (!existsSync(dir)) return {};

  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith('.md') && ID.test(f.slice(0, -3)))
      .map((f) => [f.slice(0, -3), parseComments(readFileSync(join(dir, f), 'utf8'))])
      .filter(([, list]) => list.length),
  );
};

const oneLine = (v, max, what) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string' || v.length > max || /[\r\n]/.test(v)) throw invalid(`${what} must be one short line`);

  return v.trim() || undefined;
};

/**
 * @param {string} dir the comments folder
 * @param {{ action?: unknown, screen?: unknown, heading?: unknown, text?: unknown, author?: unknown, id?: unknown, status?: unknown, note?: unknown }} change
 *   `add` (screen, text, author?, heading?), `status` (screen, id, status, note?) or `remove` (screen, id)
 * @param {Date} [now]
 * @returns {object[]} the screen's comments after the change
 */
export const changeComments = (dir, { action, screen, heading, text, author, id, status, note }, now = new Date()) => {
  if (typeof screen !== 'string' || !ID.test(screen)) throw invalid('invalid screen id');
  const file = join(dir, `${screen}.md`);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '';

  // a merge conflict in the file: writing would drop one side of it
  if (/^(<{7}|>{7}|={7})( |$)/m.test(before)) throw invalid(`comments/${screen}.md has a merge conflict: fix the file, then try again`, 409);
  const list = parseComments(before);
  // the file keeps the heading it was created with: "Comments on PL-01 · List"
  const title = /^# Comments on (.+)$/m.exec(before)?.[1] ?? oneLine(heading, 120, 'heading') ?? screen;
  let next;

  if (action === 'add') {
    if (typeof text !== 'string' || !text.trim()) throw invalid('a comment needs text');
    if (text.length > MAX) throw invalid(`a comment is at most ${MAX} characters`);
    const who = oneLine(author, 80, 'author');

    next = [...list, { id: `c${now.getTime().toString(36)}`, status: 'open', text: text.trim(), ...(who ? { author: who } : {}), createdAt: now.toISOString().slice(0, 10) }];
  } else if (action === 'status' || action === 'remove') {
    if (typeof id !== 'string' || !list.some((c) => c.id === id)) throw invalid('no such comment', 404);
    if (action === 'remove') next = list.filter((c) => c.id !== id);
    else {
      if (!isCommentStatus(status)) throw invalid('status must be open, doing or done');
      const why = oneLine(note, 300, 'note');

      next = list.map((c) => (c.id === id ? { ...c, status, ...(why ? { note: why } : {}) } : c));
    }
  } else throw invalid('action must be add, status or remove');
  mkdirSync(dir, { recursive: true });
  // a screen with no comments left has no file: nothing to carry around in git
  if (next.length) writeFileSync(file, formatComments(title, next));
  else rmSync(file, { force: true });

  return parseComments(next.length ? readFileSync(file, 'utf8') : '');
};
