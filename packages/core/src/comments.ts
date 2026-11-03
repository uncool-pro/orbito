/**
 * Comments on screens as the project keeps them: `comments/<screen-id>.md`, one file per screen, so people commenting on
 * different screens never touch the same file in git. Each comment is a change someone asks for, with a status the
 * person or Claude moves along: `open` (asked), `doing` (Claude is on it), `done` (made; the note says how).
 *
 *   # Comments on PL-01 · List
 *
 *   ## open · c1a2b3
 *   Ola · 2026-11-03
 *
 *   Too many filters on the list.
 *
 *   ## done · c1a2b4
 *   Ola · 2026-11-03 · note: moved the filters into a sheet
 *
 *   Rename "Add" to "Add a plant".
 */
export const COMMENT_STATUSES = ['open', 'doing', 'done'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export type ScreenComment = {
  id: string;
  status: CommentStatus;
  text: string;
  author?: string;
  /** `YYYY-MM-DD` */
  createdAt: string;
  /** What was done about it (or why it was reopened), one line. */
  note?: string;
};

const HEAD = /^##\s+(open|doing|done)\s*·\s*([\w-]+)\s*$/;
const META = /^(.*?)\s*·\s*(\d{4}-\d{2}-\d{2})(?:\s*·\s*note:\s*(.*))?$/;

export const isCommentStatus = (v: unknown): v is CommentStatus => typeof v === 'string' && (COMMENT_STATUSES as readonly string[]).includes(v);

/** Reads a screen's comments file. Anything outside a `## <status> · <id>` section is the file's own heading and skipped. */
export const parseComments = (markdown: string): ScreenComment[] => {
  const out: ScreenComment[] = [];
  let current: { id: string; status: CommentStatus; lines: string[] } | null = null;
  const close = () => {
    if (!current) return;
    const [meta = '', ...rest] = current.lines.filter((l, i) => i > 0 || l.trim());
    const m = META.exec(meta.trim());
    const author = m?.[1]?.trim();

    out.push({
      id: current.id,
      status: current.status,
      text: (m ? rest : [meta, ...rest]).join('\n').trim(),
      ...(author && author !== '—' ? { author } : {}),
      createdAt: m?.[2] ?? '',
      ...(m?.[3]?.trim() ? { note: m[3].trim() } : {}),
    });
    current = null;
  };

  for (const line of markdown.split(/\r?\n/)) {
    const h = HEAD.exec(line);

    if (h) {
      close();
      current = { status: h[1] as CommentStatus, id: h[2]!, lines: [] };
    } else if (/^#{1,2}\s/.test(line)) close();
    else current?.lines.push(line);
  }
  close();

  return out;
};

/** Writes a screen's comments file: open ones first, then the ones in progress, then the done ones, each in the order given. */
export const formatComments = (heading: string, comments: ScreenComment[]): string => {
  const order = (c: ScreenComment) => COMMENT_STATUSES.indexOf(c.status);
  const blocks = [...comments]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => order(a.c) - order(b.c) || a.i - b.i)
    .map(({ c }) => {
      return `## ${c.status} · ${c.id}\n${c.author ?? '—'} · ${c.createdAt}${c.note ? ` · note: ${c.note}` : ''}\n\n${c.text.trim()}\n`;
    });

  return `# Comments on ${heading}\n\n${blocks.join('\n')}`;
};
