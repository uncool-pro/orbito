/**
 * Comments on screens as the project keeps them: one file per comment, `comments/<screen-id>/<comment-id>.md`, so two
 * people commenting at the same time add two new files and never edit the same one in git. A comment is a change someone
 * asks for, with a status the person or Claude moves along: `open` (asked), `doing` (Claude is on it), `done` (made; the
 * note says how).
 *
 *   ---
 *   status: done
 *   author: Ola
 *   created: 2026-11-03T14:05:12Z
 *   note: moved the filters into a sheet
 *   ---
 *   Too many filters on the list.
 */
export const COMMENT_STATUSES = ['open', 'doing', 'done'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export type ScreenComment = {
  /** The file name without `.md`. */
  id: string;
  status: CommentStatus;
  text: string;
  author?: string;
  /** When it was written, ISO 8601 (`2026-11-03T14:05:12Z`); comments are shown in this order. */
  createdAt: string;
  /** What was done about it (or why it was reopened), one line. */
  note?: string;
};

export const isCommentStatus = (v: unknown): v is CommentStatus =>
  typeof v === 'string' && (COMMENT_STATUSES as readonly string[]).includes(v);

/** Reads one comment file; `null` when it is not one (no front matter, an unknown status). */
export const parseComment = (id: string, markdown: string): ScreenComment | null => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(markdown);

  if (!m) return null;
  const fields = Object.fromEntries(
    m[1]!
      .split(/\r?\n/)
      .map((l) => /^(\w+):\s*(.*?)\s*$/.exec(l))
      .filter((f): f is RegExpExecArray => !!f)
      .map((f) => [f[1]!, f[2]!]),
  );

  if (!isCommentStatus(fields.status)) return null;

  return {
    id,
    status: fields.status,
    text: m[2]!.trim(),
    ...(fields.author ? { author: fields.author } : {}),
    createdAt: fields.created ?? '',
    ...(fields.note ? { note: fields.note } : {}),
  };
};

/** Writes one comment file. */
export const formatComment = (c: ScreenComment): string =>
  [
    '---',
    `status: ${c.status}`,
    ...(c.author ? [`author: ${c.author}`] : []),
    `created: ${c.createdAt}`,
    ...(c.note ? [`note: ${c.note}`] : []),
    '---',
    c.text.trim(),
    '',
  ].join('\n');

/** Oldest first, the order a conversation reads in. */
export const byCreated = (a: ScreenComment, b: ScreenComment) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
