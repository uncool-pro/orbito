import { useSyncExternalStore } from 'react';

import type { Status, StatusFile } from '@uncool-pro/orbito-core';

/**
 * Screen statuses. The build ships the file's content read-only; the dev server reads and writes `.orbito/status.json`
 * through the Vite plugin (`/__orbito/status`), so a change on the board is a change in the repo (and in git history).
 */
let state: StatusFile = {};
let editable = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const initStatuses = (initial: StatusFile, canEdit: boolean) => {
  state = initial;
  editable = canEdit;
  if (canEdit)
    fetch('/__orbito/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((s: StatusFile | null) => {
        if (s) {
          state = s;
          emit();
        }
      })
      .catch(() => undefined);
};

export const useStatuses = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);

      return () => subs.delete(f);
    },
    () => state,
  );

export const canEditStatuses = () => editable;

export const setStatus = async (id: string, status: Status, note?: string) => {
  const prev = state;

  state = { ...state, [id]: { status, note, updatedAt: new Date().toISOString().slice(0, 10) } };
  emit();
  try {
    const r = await fetch('/__orbito/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, note }) });

    if (!r.ok) throw new Error(await r.text());
  } catch (err) {
    console.error('[orbito] could not save the status', err);
    state = prev;
    emit();
  }
};
