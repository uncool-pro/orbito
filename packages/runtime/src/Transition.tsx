import { useEffect } from 'react';

import { useFrame } from './context';
import { goTo } from './navigation';

type TransitionProps = {
  /** Screen this one moves to without a tap. */
  to: string;
  /** What causes it: `error` (e.g. no connection), `timeout`, `auto` (after a moment), or your own word. Shown on the arrows. */
  on: 'error' | 'timeout' | 'auto' | (string & {});
  /** What happens, in a few words (the arrow's label), e.g. "No connection". */
  label: string;
  /** Only for `auto`: in the clickable prototype, go there after this many milliseconds. */
  after?: number;
};

/**
 * A transition the person does not trigger: an error, a timeout, a success screen that returns by itself.
 * It draws nothing on the screen; the board and the flows diagram draw it as an arrow, so negative paths
 * (errors, failures) are mapped like any other.
 */
export const Transition = ({ to, on, label, after }: TransitionProps) => {
  const { mode } = useFrame();

  useEffect(() => {
    if (mode !== 'screen' || on !== 'auto' || !after) return;
    const t = window.setTimeout(() => goTo(to), after);

    return () => window.clearTimeout(t);
  }, [mode, on, after, to]);

  return <span data-pd-to={to} data-pd-trigger={on} aria-label={label} aria-hidden="true" hidden />;
};
