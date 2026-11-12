import { useSyncExternalStore } from 'react';

import type { CommentStatus, ScreenComment } from '@uncool-pro/orbito-core';

import { recall, remember } from './remembered';

export type CommentsFile = Record<string, ScreenComment[]>;

/**
 * Comments on screens, as changes with a status: open (asked), doing (Claude is on it), done (made). The build ships
 * them read-only; the dev server reads and writes `comments/<screen-id>/<comment-id>.md` (one file per comment) through the Vite plugin
 * (`/__orbito/comments`), so a comment travels through git with the mockups and Claude reads and moves it along too.
 */
let state: CommentsFile = {};
let editable = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const AUTHOR_KEY = 'pd.author';
const NONE: ScreenComment[] = [];

export const initComments = (initial: CommentsFile | undefined, canEdit: boolean) => {
  state = initial ?? {};
  editable = canEdit;
};

// the dev server pushes the comments whenever a comment file changes, also when Claude edits one
const hot = (import.meta as unknown as { hot?: { on: (event: string, cb: (data: CommentsFile) => void) => void } }).hot;

hot?.on('orbito:comments', (all) => {
  state = all;
  emit();
});

const subscribe = (f: () => void) => {
  subs.add(f);

  return () => subs.delete(f);
};

export const useComments = (screen: string) => useSyncExternalStore(subscribe, () => state[screen] ?? NONE);

/** How many comments on a screen still wait to be made (open or in progress). */
export const useOpenCount = (screen: string) => useComments(screen).filter((c) => c.status !== 'done').length;

export const canComment = () => editable;

/** The name shown with your comments, remembered on this computer only. */
export const readAuthor = () => recall(AUTHOR_KEY) ?? '';

const send = async (body: Record<string, string>) => {
  const r = await fetch('/__orbito/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as { error?: string; screen: string; comments: ScreenComment[] };

  if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
  state = { ...state, [data.screen]: data.comments };
  emit();
};

/** Remembers the name comments are signed with, on this computer. */
export const saveAuthor = (author: string) => remember(AUTHOR_KEY, author);

export const addComment = (screen: string, text: string, author: string) => {
  saveAuthor(author);

  return send({ action: 'add', screen, text, author });
};

export const setCommentStatus = (screen: string, id: string, status: CommentStatus) =>
  send({ action: 'status', screen, id, status });

export const removeComment = (screen: string, id: string) => send({ action: 'remove', screen, id });
