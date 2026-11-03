// Comments on screens (`.orbito/comments.json`): added and resolved on the board, read by Claude like any project file.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const invalid = (message, code = 400) => Object.assign(new Error(message), { code });
const MAX = 2000;

/** The comments in the file. A file that cannot be read (e.g. a merge conflict) stops the save: writing would lose the others. */
const readAll = (file) => {
  if (!existsSync(file)) return {};
  const text = readFileSync(file, 'utf8');

  if (!text.trim()) return {};
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw invalid(`${file} cannot be read: fix the file (is there a merge conflict?), then try again`, 409);

  return data;
};

const write = (file, all) => {
  const sorted = Object.fromEntries(
    Object.entries(all)
      .filter(([, list]) => Array.isArray(list) && list.length)
      .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })),
  );

  mkdirSync(dirname(file), { recursive: true });
  // written in place, never replaced by a rename: in a container this file is mounted on its own
  writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
};

/**
 * @param {string} file the comments file
 * @param {{ action?: unknown, screen?: unknown, text?: unknown, author?: unknown, id?: unknown }} change
 *   `add` (screen, text, author?) or `resolve` (screen, id): a resolved comment leaves the file, git keeps its history
 * @param {Date} [now]
 * @returns {{ id: string, text: string, author?: string, createdAt: string }[]} the screen's comments after the change
 */
export const changeComments = (file, { action, screen, text, author, id }, now = new Date()) => {
  if (typeof screen !== 'string' || !/^[\w.-]+$/.test(screen)) throw invalid('invalid screen id');
  const all = readAll(file);
  const list = Array.isArray(all[screen]) ? all[screen] : [];

  if (action === 'add') {
    if (typeof text !== 'string' || !text.trim()) throw invalid('a comment needs text');
    if (text.length > MAX) throw invalid(`a comment is at most ${MAX} characters`);
    if (author !== undefined && author !== null && (typeof author !== 'string' || author.length > 80)) throw invalid('author must be a short name');
    const entry = { id: `c${now.getTime().toString(36)}`, text: text.trim(), ...(author?.trim() ? { author: author.trim() } : {}), createdAt: now.toISOString().slice(0, 10) };

    all[screen] = [...list, entry];
  } else if (action === 'resolve') {
    if (typeof id !== 'string' || !list.some((c) => c.id === id)) throw invalid('no such comment', 404);
    all[screen] = list.filter((c) => c.id !== id);
  } else throw invalid('action must be add or resolve');
  write(file, all);

  return all[screen] ?? [];
};
