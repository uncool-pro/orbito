import { useEffect, useRef, useState } from 'react';

/** How long a button says "copied" after a copy. */
const SHOWN_FOR = 1400;

/**
 * Copies text to the clipboard and remembers, for a moment, what was copied, so the button that did it can say so.
 * `copied` is the name given to the last copy (`'path'`, `'code'`…), or `null`.
 */
export const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = (what: string, text: string) =>
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), SHOWN_FOR);
    });

  return { copied, copy };
};
