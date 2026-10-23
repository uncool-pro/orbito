import type { ReactNode } from 'react';

type GridProps = {
  /** Narrowest a column may get, in px; columns are added while they fit and wrap below that (no media queries needed). */
  min?: number;
  /** Gap token suffix: `space-<gap>`. */
  gap?: 2 | 3 | 4 | 5 | 6 | 8;
  /** Vertical alignment of items in a row. */
  align?: 'start' | 'center' | 'stretch';
  children: ReactNode;
};

/**
 * Columns that adapt to the width they get: as many as fit at `min` px, one column on a phone.
 * Pages use it instead of media queries, so the same markup works on the board, in the prototype and in a static export.
 */
export const Grid = ({ min = 280, gap = 5, align = 'stretch', children }: GridProps) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: `var(--space-${gap})`, alignItems: align }}>{children}</div>
);
