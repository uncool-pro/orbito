import { useEffect, useState } from 'react';

import { canComment, readAuthor, saveAuthor } from '../comments';
import { useDevEnv } from '../dev';
import { useT } from '../i18n';
import { recall, remember } from '../remembered';

const SEEN = 'pd.welcomed';

/**
 * The first time Orbito opens in a browser: how it works in one sentence (you ask Claude, Claude changes the mockups,
 * you look here) and the name your comments are signed with, suggested from git when git knows it. No tour: the rest is
 * found where it is. Shown once per browser, only on the live board.
 */
export const Welcome = () => {
  const t = useT();
  const env = useDevEnv();
  const [open, setOpen] = useState(() => recall(SEEN) !== '1');
  const [name, setName] = useState(readAuthor);
  const [typed, setTyped] = useState(false);

  // git's name is only a suggestion: it never replaces what the person typed, even when it arrives later
  useEffect(() => {
    if (!typed && env?.name) setName((n) => n || env.name!);
  }, [env?.name, typed]);

  // a shared static board (a build) has no comments to sign
  if (!open || !canComment()) return null;
  const done = () => {
    if (name.trim()) saveAuthor(name.trim());
    remember(SEEN, '1');
    setOpen(false);
  };

  return (
    <div className="pd-welcome" role="dialog" aria-modal="true" aria-labelledby="pd-welcome-title" data-pd-ui>
      <form
        className="pd-welcome__card"
        onSubmit={(e) => {
          e.preventDefault();
          done();
        }}
      >
        <h2 id="pd-welcome-title">{t.welcomeTitle}</h2>
        <p>{t.welcomeText}</p>
        <label className="pd-field">
          <span>{t.welcomeName}</span>
          <input className="pd-input" value={name} maxLength={80} autoFocus placeholder={t.yourName} onChange={(e) => {
              setTyped(true);
              setName(e.target.value);
            }}
          />
        </label>
        <button type="submit" className="pd-btn pd-btn--primary">
          {t.welcomeStart}
        </button>
      </form>
    </div>
  );
};
