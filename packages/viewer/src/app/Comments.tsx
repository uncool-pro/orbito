import { useState } from 'react';
import type { ComponentType } from 'react';

import { COMMENT_STATUSES } from '@uncool-pro/orbito-core';
import type { CommentStatus, Screen } from '@uncool-pro/orbito-core';

import { addComment, canComment, readAuthor, removeComment, setCommentStatus, useComments } from '../comments';
import { useT } from '../i18n';

/**
 * The comments on a screen: changes people ask for, each with a status (open → doing → done) that the person or Claude
 * moves along. Open ones first; done ones fold away under one line. Kept in `comments/<screen-id>.md`, so they travel
 * through git with the mockups. Shown in the screen details and next to the screen in the prototype.
 */
export const Comments = ({ screen }: { screen: Screen<ComponentType> }) => {
  const list = useComments(screen.id);
  const t = useT();
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(readAuthor);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const editable = canComment();
  const waiting = list.filter((c) => c.status !== 'done');
  const done = list.filter((c) => c.status === 'done');
  const heading = `${screen.code ? `${screen.code} · ` : ''}${screen.title.split(' / ').pop()}`;
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
  const item = (c: (typeof list)[number]) => (
    <article key={c.id} className={`pd-comment pd-comment--${c.status}`}>
      <p>{c.text}</p>
      {c.note && <p className="pd-comment__note">{c.note}</p>}
      <footer>
        <span>
          {c.author ?? t.anonymous} · {c.createdAt}
        </span>
        {editable ? (
          <span className="pd-comment__actions">
            <select className="pd-comment__status" value={c.status} disabled={busy} aria-label={t.status} onChange={(e) => run(setCommentStatus(screen.id, c.id, e.target.value as CommentStatus))}>
              {COMMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.commentStatus[s]}
                </option>
              ))}
            </select>
            <button type="button" className="pd-comment__remove" disabled={busy} title={t.removeComment} aria-label={t.removeComment} onClick={() => run(removeComment(screen.id, c.id))}>
              ×
            </button>
          </span>
        ) : (
          <span className="pd-comment__chip">{t.commentStatus[c.status]}</span>
        )}
      </footer>
    </article>
  );

  return (
    <section className="pd-insp__comments">
      <h4>
        {t.comments} {waiting.length > 0 && <span className="pd-count">{waiting.length}</span>}
      </h4>
      {waiting.map(item)}
      {done.length > 0 && (
        <button type="button" className="pd-insp__more" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
          {t.doneCount(done.length)}
        </button>
      )}
      {showDone && done.map(item)}
      {editable ? (
        <form
          className="pd-comment__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) run(addComment(screen.id, heading, text, author), () => setText(''));
          }}
        >
          <textarea className="pd-input" rows={2} placeholder={t.commentPlaceholder} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
          <div className="pd-comment__row">
            <input className="pd-input" placeholder={t.yourName} value={author} maxLength={80} onChange={(e) => setAuthor(e.target.value)} />
            <button type="submit" className="pd-btn pd-btn--sm" disabled={!text.trim() || busy}>
              {t.addComment}
            </button>
          </div>
          {error && <p className="pd-warn">{error}</p>}
          <p className="pd-insp__fine">{t.commentsWhere(screen.id)}</p>
        </form>
      ) : (
        list.length === 0 && <p className="pd-muted">{t.noComments}</p>
      )}
    </section>
  );
};
