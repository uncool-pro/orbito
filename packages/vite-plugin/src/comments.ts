// Comments on screens: `comments/<screen-id>/<comment-id>.md`, one file per comment (format in core/src/comments.ts).
// Added and moved along on the board, read and moved along by Claude, shared through git like the mockups; a new
// comment is a new file, so people commenting at the same time never edit the same one.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { byCreated, formatComment, isCommentStatus, parseComment } from '@uncool-pro/orbito-core';
import type { ScreenComment } from '@uncool-pro/orbito-core';

import { RequestError } from './errors.ts';
import { inside } from './files.ts';

const MAX = 2000;
/** A screen id or a comment id used as a folder or file name: letters, digits, `_`, `-` and dots, never starting with a dot, so never `.` or `..`. */
const ID = /^[\w-][\w.-]*$/;
const CONFLICT = /^(<{7}|>{7}|={7})( |$)/m;

export type CommentChange = {
  action?: unknown;
  screen?: unknown;
  text?: unknown;
  author?: unknown;
  id?: unknown;
  status?: unknown;
  note?: unknown;
};
export type CommentsByScreen = Record<string, ScreenComment[]>;

const isId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);

/** The time in the name of a comment file Orbito wrote (`<time>-<random>.md`), or 0 for any other file. */
const stampOf = (file: string) => {
  const m = /^([0-9a-z]+)-[0-9a-z]+\.md$/.exec(file);

  return m ? Number.parseInt(m[1]!, 36) : 0;
};

const readScreen = (dir: string): ScreenComment[] =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.md') && ID.test(f.slice(0, -3)))
    .map((f) => parseComment(f.slice(0, -3), readFileSync(join(dir, f), 'utf8')))
    .filter((c): c is ScreenComment => !!c)
    .sort(byCreated);

/** Every screen's comments, by screen id, oldest first. */
export const readComments = (dir: string): CommentsByScreen => {
  if (!existsSync(dir)) return {};

  return Object.fromEntries(
    readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && ID.test(d.name))
      .map((d) => [d.name, readScreen(join(dir, d.name))] as const)
      .filter(([, list]) => list.length),
  );
};

const oneLine = (v: unknown, max: number, what: string): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string' || v.length > max || /[\r\n]/.test(v))
    throw new RequestError(`${what} must be one short line`);

  return v.trim() || undefined;
};

/**
 * Changes the comments of one screen: `add` (screen, text, author?), `status` (screen, id, status, note?) or `remove`
 * (screen, id). Returns the screen's comments after the change, oldest first.
 */
export const changeComments = (
  dir: string,
  { action, screen, text, author, id, status, note }: CommentChange,
  now = new Date(),
): ScreenComment[] => {
  if (!isId(screen)) throw new RequestError('invalid screen id');
  const folder = join(dir, screen);

  // the id is checked above; this is the second lock on the same door: a change never leaves the comments folder
  if (!inside(dir, folder)) throw new RequestError('invalid screen id');
  if (action === 'add') {
    if (typeof text !== 'string' || !text.trim()) throw new RequestError('a comment needs text');
    if (text.length > MAX) throw new RequestError(`a comment is at most ${MAX} characters`);
    const who = oneLine(author, 80, 'author');
    mkdirSync(folder, { recursive: true });
    // the time, then a few random letters: two people commenting in the same millisecond still get two files. The time
    // is always later than the newest comment's here, so comments written in the same instant keep the order they were
    // written in (the names sort the same way the comments are read); a name from the far future is not followed
    const newest = Math.max(
      0,
      ...readdirSync(folder)
        .map(stampOf)
        .filter((t) => t <= now.getTime() + 60_000),
    );
    const fresh = `${Math.max(now.getTime(), newest + 1).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    writeFileSync(
      join(folder, `${fresh}.md`),
      formatComment({
        id: fresh,
        status: 'open',
        text: text.trim(),
        ...(who ? { author: who } : {}),
        createdAt: now.toISOString().replace(/\.\d+Z$/, 'Z'),
      }),
    );
  } else if (action === 'status' || action === 'remove') {
    if (!isId(id) || !existsSync(join(folder, `${id}.md`))) throw new RequestError('no such comment', 404);
    const file = join(folder, `${id}.md`);
    const before = readFileSync(file, 'utf8');

    // a merge conflict in the file: writing would drop one side of it
    if (CONFLICT.test(before))
      throw new RequestError(`comments/${screen}/${id}.md has a merge conflict: fix the file, then try again`, 409);
    if (action === 'remove') {
      rmSync(file);
      // a screen with no comments left has no folder: nothing to carry around in git
      if (!readdirSync(folder).length) rmdirSync(folder);
    } else {
      if (!isCommentStatus(status)) throw new RequestError('status must be open, doing or done');
      const current = parseComment(id, before);

      if (!current)
        throw new RequestError(`comments/${screen}/${id}.md cannot be read: fix the file, then try again`, 409);
      const why = oneLine(note, 300, 'note');

      writeFileSync(file, formatComment({ ...current, status, ...(why ? { note: why } : {}) }));
    }
  } else throw new RequestError('action must be add, status or remove');

  return existsSync(folder) ? readScreen(folder) : [];
};
