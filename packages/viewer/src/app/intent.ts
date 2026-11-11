type Update<T> = (current: T) => T;

/**
 * Applies changes only once the pointer has rested: `soon` waits for `delay` ms without another change, `now` applies
 * at once. Changes asked for while waiting are applied in order, as if each had been applied when it was asked.
 *
 * For what follows the pointer and costs a repaint (the highlight of related screens on the board): a pointer that
 * only passes over the cards changes nothing, the one that stops on a card gets its highlight a moment later.
 */
export const createIntent = <T>(apply: (update: Update<T>) => void, delay = 60) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: Update<T> | null = null;
  const flush = () => {
    const update = waiting;

    timer = undefined;
    waiting = null;
    if (update) apply(update);
  };

  return {
    soon: (update: Update<T>) => {
      const before = waiting;

      waiting = before ? (current) => update(before(current)) : update;
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    now: (update: Update<T>) => {
      const before = waiting;

      clearTimeout(timer);
      timer = undefined;
      waiting = null;
      apply(before ? (current) => update(before(current)) : update);
    },
    cancel: () => {
      clearTimeout(timer);
      timer = undefined;
      waiting = null;
    },
  };
};
