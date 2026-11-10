import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { COMMENT_STATUSES, screenName } from '@uncool-pro/orbito-core';
import type { CommentStatus, Screen, ScreenComment } from '@uncool-pro/orbito-core';

import { addComment, canComment, readAuthor, removeComment, setCommentStatus, useComments } from '../comments';
import { useT } from '../i18n';
import { useViewer } from './context';
import { Icon } from './icons';
import { useShell } from './shell/state';

/**
 * Comments on a screen, as in Figma: a bubble next to the screen itself, on the board and in the prototype. A comment is a
 * change people ask for, with a status (open → doing → done) that the person or Claude moves along. Open ones first,
 * each group oldest first; done ones fold away under one line. One file per comment in `comments/<screen-id>/`, so they
 * travel through git with the mockups and two people commenting never touch one file.
 *
 * Opened from the comment button above a card, the comments button in the prototype or the line in the screen details
 * (each marked `data-comments-opener`); Esc or a click elsewhere closes it.
 */

/** When a comment was written, short: "3 Nov, 14:05" (older files have the date only). */
const when = (iso: string) => {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return iso;

  return /T/.test(iso)
    ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const MARGIN = 8;
const GAP = 12;

/** The bubble of the screen whose comments are open, wherever that screen is drawn (`data-comment-anchor`). */
export const CommentBubble = () => {
  const { commentsOn, openComments } = useShell();
  const { screens } = useViewer();
  const screen = commentsOn ? screens.get(commentsOn) : undefined;

  return screen ? <Bubble key={screen.id} screen={screen} onClose={() => openComments(null)} /> : null;
};

const Bubble = ({ screen, onClose }: { screen: Screen<ComponentType>; onClose: () => void }) => {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);

  close.current = onClose;

  // follows the screen while the board moves: one write per frame, outside React; next to the screen on the right, on
  // the left when there is no room, always inside the canvas area. A screen that is no longer drawn closes the bubble.
  useLayoutEffect(() => {
    let frame = 0;
    let missing = 0;
    const place = () => {
      const el = box.current;
      const anchor = [
        ...document.querySelectorAll<HTMLElement>(`[data-comment-anchor="${CSS.escape(screen.id)}"]`),
      ].find((a) => a.offsetParent !== null);

      if (el && anchor) {
        missing = 0;
        const r = anchor.getBoundingClientRect();
        const area =
          document.querySelector('.pd-main')?.getBoundingClientRect() ??
          new DOMRect(0, 0, window.innerWidth, window.innerHeight);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const right = r.right + GAP;
        let x = right + w <= area.right - MARGIN ? right : r.left - GAP - w;

        x = Math.max(area.left + MARGIN, Math.min(x, area.right - w - MARGIN));
        const y = Math.max(area.top + MARGIN, Math.min(r.top, area.bottom - h - MARGIN));

        el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        // shown at its place first, then the cursor goes to the field (a hidden field cannot take it)
        if (el.style.visibility !== 'visible') {
          el.style.visibility = 'visible';
          el.querySelector<HTMLTextAreaElement>('textarea')?.focus();
        }
      } else if (++missing > 30) {
        close.current();

        return;
      }
      frame = requestAnimationFrame(place);
    };

    place();

    return () => cancelAnimationFrame(frame);
  }, [screen.id]);

  // Esc closes the bubble only (the board keeps its selection); a press outside it closes it too
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close.current();
    };
    const down = (e: PointerEvent) => {
      const target = e.target as Element;

      if (box.current?.contains(target) || target.closest('[data-comments-opener]')) return;
      close.current();
    };

    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', down, true);

    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', down, true);
    };
  }, []);

  const name = screenName(screen);

  return (
    <div
      ref={box}
      className="pd-bubble"
      role="dialog"
      aria-label={t.commentsOn(name)}
      data-pd-ui
      style={{ visibility: 'hidden' }}
    >
      <header className="pd-bubble__head" title={t.commentsWhere(screen.id)}>
        <Icon name="message-circle" size={15} />
        <b>{name}</b>
        {screen.code && <small>{screen.code}</small>}
        <button
          type="button"
          className="pd-bubble__close"
          onClick={onClose}
          aria-label={t.closeComments}
          title={t.closeComments}
        >
          <Icon name="x" size={15} />
        </button>
      </header>
      <Thread screen={screen.id} />
    </div>
  );
};

const Thread = ({ screen }: { screen: string }) => {
  const list = useComments(screen);
  const t = useT();
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(readAuthor);
  const [naming, setNaming] = useState(() => !readAuthor());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const editable = canComment();
  const waiting = list.filter((c) => c.status !== 'done');
  const done = list.filter((c) => c.status === 'done');
  const run = (job: Promise<void>, after?: () => void) => {
    setBusy(true);
    setError(null);
    job.then(
      () => {
        setBusy(false);
        after?.();
      },
      (e: unknown) => {
        setBusy(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };
  const submit = () => {
    if (text.trim() && !busy)
      run(addComment(screen, text, author), () => {
        setText('');
        if (author.trim()) setNaming(false);
      });
  };

  return (
    <>
      <div className="pd-bubble__list">
        {waiting.map((c) => (
          <Item key={c.id} c={c} screen={screen} editable={editable} busy={busy} run={run} />
        ))}
        {done.length > 0 && (
          <button
            type="button"
            className="pd-bubble__more"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
          >
            <Icon name="circle-check" size={14} /> {t.doneCount(done.length)}
          </button>
        )}
        {showDone &&
          done.map((c) => <Item key={c.id} c={c} screen={screen} editable={editable} busy={busy} run={run} />)}
        {list.length === 0 && <p className="pd-bubble__empty">{editable ? t.firstComment : t.noComments}</p>}
      </div>
      {editable && (
        <form
          className="pd-bubble__form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {naming && (
            <input
              className="pd-input"
              placeholder={t.yourName}
              value={author}
              maxLength={80}
              onChange={(e) => setAuthor(e.target.value)}
            />
          )}
          <div className="pd-bubble__write">
            <textarea
              rows={2}
              placeholder={t.commentPlaceholder}
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              // Enter sends, Shift+Enter starts a new line, as in chat
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="submit"
              className="pd-bubble__send"
              disabled={!text.trim() || busy}
              aria-label={t.addComment}
              title={t.addComment}
            >
              <Icon name="send" size={15} />
            </button>
          </div>
          {!naming && (
            <p className="pd-bubble__as">
              {author ? t.signedAs(author) : t.anonymous} ·{' '}
              <button type="button" onClick={() => setNaming(true)}>
                {t.changeName}
              </button>
            </p>
          )}
          {error && <p className="pd-warn">{error}</p>}
        </form>
      )}
    </>
  );
};

const Item = ({
  c,
  screen,
  editable,
  busy,
  run,
}: {
  c: ScreenComment;
  screen: string;
  editable: boolean;
  busy: boolean;
  run: (job: Promise<void>) => void;
}) => {
  const t = useT();
  const who = c.author ?? t.anonymous;

  return (
    <article className={`pd-comment pd-comment--${c.status}`}>
      <div className="pd-comment__top">
        <span className="pd-avatar" aria-hidden="true">
          {who.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <b className="pd-comment__author">{who}</b>
        <time className="pd-comment__when" dateTime={c.createdAt}>
          {when(c.createdAt)}
        </time>
        {editable && (
          <button
            type="button"
            className="pd-comment__remove"
            disabled={busy}
            title={t.removeComment}
            aria-label={t.removeComment}
            onClick={() => run(removeComment(screen, c.id))}
          >
            <Icon name="x" size={13} />
          </button>
        )}
      </div>
      <p className="pd-comment__text">{c.text}</p>
      {c.note && <p className="pd-comment__note">{c.note}</p>}
      {editable ? (
        <select
          className={`pd-comment__status is-${c.status}`}
          value={c.status}
          disabled={busy}
          aria-label={t.status}
          onChange={(e) => run(setCommentStatus(screen, c.id, e.target.value as CommentStatus))}
        >
          {COMMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.commentStatus[s]}
            </option>
          ))}
        </select>
      ) : (
        <span className={`pd-comment__status is-${c.status}`}>{t.commentStatus[c.status]}</span>
      )}
    </article>
  );
};

/** In the screen details: one line with how many comments wait, opening the bubble next to the screen. */
export const CommentsLine = ({ screen }: { screen: Screen<ComponentType> }) => {
  const t = useT();
  const { select, openComments, commentsOn } = useShell();
  const list = useComments(screen.id);
  const waiting = list.filter((c) => c.status !== 'done').length;
  const open = commentsOn === screen.id;

  if (!list.length && !canComment()) return null;

  return (
    <section className="pd-insp__comments">
      <h4>{t.comments}</h4>
      <button
        type="button"
        className="pd-commentsline"
        data-comments-opener
        aria-expanded={open}
        onClick={() => {
          if (open) return openComments(null);
          select(screen.id, { focus: true });
          openComments(screen.id);
        }}
      >
        <Icon name="message-circle" size={15} />
        <span>{waiting ? t.commentsWaiting(waiting) : list.length ? t.doneCount(list.length) : t.writeComment}</span>
        {waiting > 0 && <span className="pd-count">{waiting}</span>}
      </button>
    </section>
  );
};
