// Comments on screens: `comments/<screen-id>/<comment-id>.md`, one file per comment (format in core/src/comments.ts).
// Added and moved along on the board, read and moved along by Claude, shared through git like the mockups; a new
// comment is a new file, so people commenting at the same time never edit the same one.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { byCreated, formatComment, isCommentStatus, parseComment } from '@uncool-pro/orbito-core';

const invalid = (message, code = 400) => Object.assign(new Error(message), { code });
const MAX = 2000;
const ID = /^[\w.-]+$/;
const CONFLICT = /^(<{7}|>{7}|={7})( |$)/m;

const readScreen = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.md') && ID.test(f.slice(0, -3)))
    .map((f) => parseComment(f.slice(0, -3), readFileSync(join(dir, f), 'utf8')))
    .filter(Boolean)
    .sort(byCreated);

/** Every screen's comments, by screen id, oldest first. */
export const readComments = (dir) => {
  if (!existsSync(dir)) return {};

  return Object.fromEntries(
    readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && ID.test(d.name))
      .map((d) => [d.name, readScreen(join(dir, d.name))])
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
 * @param {{ action?: unknown, screen?: unknown, text?: unknown, author?: unknown, id?: unknown, status?: unknown, note?: unknown }} change
 *   `add` (screen, text, author?), `status` (screen, id, status, note?) or `remove` (screen, id)
 * @param {Date} [now]
 * @returns {object[]} the screen's comments after the change, oldest first
 */
export const changeComments = (dir, { action, screen, text, author, id, status, note }, now = new Date()) => {
  if (typeof screen !== 'string' || !ID.test(screen)) throw invalid('invalid screen id');
  const folder = join(dir, screen);

  if (action === 'add') {
    if (typeof text !== 'string' || !text.trim()) throw invalid('a comment needs text');
    if (text.length > MAX) throw invalid(`a comment is at most ${MAX} characters`);
    const who = oneLine(author, 80, 'author');
    // the time, then a few random letters: two people commenting in the same millisecond still get two files
    const fresh = `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, `${fresh}.md`), formatComment({ id: fresh, status: 'open', text: text.trim(), ...(who ? { author: who } : {}), createdAt: now.toISOString().replace(/\.\d+Z$/, 'Z') }));
  } else if (action === 'status' || action === 'remove') {
    const file = typeof id === 'string' && ID.test(id) ? join(folder, `${id}.md`) : null;

    if (!file || !existsSync(file)) throw invalid('no such comment', 404);
    const before = readFileSync(file, 'utf8');

    // a merge conflict in the file: writing would drop one side of it
    if (CONFLICT.test(before)) throw invalid(`comments/${screen}/${id}.md has a merge conflict: fix the file, then try again`, 409);
    if (action === 'remove') {
      rmSync(file);
      // a screen with no comments left has no folder: nothing to carry around in git
      if (!readdirSync(folder).length) rmdirSync(folder);
    } else {
      if (!isCommentStatus(status)) throw invalid('status must be open, doing or done');
      const current = parseComment(id, before);

      if (!current) throw invalid(`comments/${screen}/${id}.md cannot be read: fix the file, then try again`, 409);
      const why = oneLine(note, 300, 'note');

      writeFileSync(file, formatComment({ ...current, status, ...(why ? { note: why } : {}) }));
    }
  } else throw invalid('action must be add, status or remove');

  return existsSync(folder) ? readScreen(folder) : [];
};
