// Writes one entry of the status file (`.orbito/status.json`) and nothing else.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { isStatus, STATUSES } from '@uncool-pro/orbito-core';

const invalid = (message, code = 400) => Object.assign(new Error(message), { code });

/** The entries in the file. A file that cannot be read (e.g. a merge conflict) stops the save: writing would lose the other entries. */
const readEntries = (file) => {
  if (!existsSync(file)) return {};
  const text = readFileSync(file, 'utf8');

  if (!text.trim()) return {};
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw invalid(`${file} cannot be read: fix the file (is there a merge conflict?), then set the status again`, 409);

  return data;
};

/**
 * @param {string} file the status file
 * @param {{ id?: unknown, status?: unknown, note?: unknown }} change
 * @param {string} [today] `YYYY-MM-DD`
 * @returns {{ status: string, note?: string, updatedAt: string }} the saved entry
 */
export const saveStatus = (file, { id, status, note }, today = new Date().toISOString().slice(0, 10)) => {
  if (typeof id !== 'string' || !/^[\w.:/-]+$/.test(id)) throw invalid('invalid status id');
  if (!isStatus(status)) throw invalid(`status must be one of: ${STATUSES.join(', ')}`);
  if (note !== undefined && note !== null && typeof note !== 'string') throw invalid('note must be text');
  const all = readEntries(file);
  const entry = { status, ...(note?.trim() ? { note: note.trim() } : {}), updatedAt: today };

  all[id] = entry;
  const sorted = Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));

  mkdirSync(dirname(file), { recursive: true });
  // written in place, never replaced by a rename: in a container this file is mounted on its own
  writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');

  return entry;
};
