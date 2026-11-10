// Writes one entry of the status file (`.orbito/status.json`) and nothing else.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { isStatus, STATUSES } from '@uncool-pro/orbito-core';
import type { StatusEntry } from '@uncool-pro/orbito-core';

import { RequestError } from './errors.ts';

export type StatusChange = { id?: unknown; status?: unknown; note?: unknown };
export type SavedStatus = StatusEntry & { updatedAt: string };

/** The entries in the file. A file that cannot be read (e.g. a merge conflict) stops the save: writing would lose the other entries. */
const readEntries = (file: string): [string, unknown][] => {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');

  if (!text.trim()) return [];
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new RequestError(`${file} cannot be read: fix the file (is there a merge conflict?), then set the status again`, 409);

  return Object.entries(data);
};

/** Saves the status of one feature (`today` is `YYYY-MM-DD`) and returns the saved entry. */
export const saveStatus = (file: string, { id, status, note }: StatusChange, today = new Date().toISOString().slice(0, 10)): SavedStatus => {
  if (typeof id !== 'string' || !/^[\w.:/-]+$/.test(id)) throw new RequestError('invalid status id');
  if (!isStatus(status)) throw new RequestError(`status must be one of: ${STATUSES.join(', ')}`);
  if (note !== undefined && note !== null && typeof note !== 'string') throw new RequestError('note must be text');
  const entry: SavedStatus = { status, ...(note?.trim() ? { note: note.trim() } : {}), updatedAt: today };
  // a list of pairs, never keys set on an object: an id such as `__proto__` stays an ordinary entry
  const entries: [string, unknown][] = [...readEntries(file).filter(([key]) => key !== id), [id, entry]];

  entries.sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }));
  mkdirSync(dirname(file), { recursive: true });
  // written in place, never replaced by a rename: in a container this file is mounted on its own
  writeFileSync(file, JSON.stringify(Object.fromEntries(entries), null, 2) + '\n');

  return entry;
};
