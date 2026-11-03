import { useSyncExternalStore } from 'react';

import { recall, remember } from './remembered';

/** One comment on a screen, as `.orbito/comments.json` keeps it. */
export type ScreenComment = { id: string; text: string; author?: string; createdAt: string };
export type CommentsFile = Record<string, ScreenComment[]>;

/**
 * Comments on screens. The build ships them read-only; the dev server reads and writes `.orbito/comments.json` through the
 * Vite plugin (`/__orbito/comments`), so a comment is a line in the repo that Claude reads too.
 */
let state: CommentsFile = {};
let editable = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const AUTHOR_KEY = 'pd.author';

export const initComments = (initial: CommentsFile | undefined, canEdit: boolean) => {
  state = initial ?? {};
  editable = canEdit;
};

// the dev server pushes the file whenever it changes, also when Claude edits it
const hot = (import.meta as unknown as { hot?: { on: (event: string, cb: (data: CommentsFile) => void) => void } }).hot;

hot?.on('orbito:comments', (file) => {
  state = file;
  emit();
});

export const useComments = (screen: string) =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);

      return () => subs.delete(f);
    },
    () => state[screen],
  ) ?? [];

export const canComment = () => editable;

/** The name shown with your comments, remembered on this computer only. */
export const readAuthor = () => recall(AUTHOR_KEY) ?? '';

const send = async (body: Record<string, string>) => {
  const r = await fetch('/__orbito/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await r.json()) as { error?: string; screen: string; comments: ScreenComment[] };

  if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
  state = { ...state, [data.screen]: data.comments };
  emit();
};

export const addComment = (screen: string, text: string, author: string) => {
  remember(AUTHOR_KEY, author);

  return send({ action: 'add', screen, text, author });
};

export const resolveComment = (screen: string, id: string) => send({ action: 'resolve', screen, id });
