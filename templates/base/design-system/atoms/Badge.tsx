import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, [string, string]> = {
  neutral: ['var(--color-surface-muted)', 'var(--color-ink-muted)'],
  accent: ['var(--color-accent-soft)', 'var(--color-accent)'],
  success: ['var(--color-success-soft)', 'var(--color-success)'],
  warning: ['var(--color-warning-soft)', 'var(--color-warning)'],
  danger: ['var(--color-danger-soft)', 'var(--color-danger)'],
};

/** A short status or count next to something else. Not pressable. */
export const Badge = ({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 22,
      padding: '0 var(--space-2)',
      borderRadius: 'var(--radius-pill)',
      background: tones[tone][0],
      color: tones[tone][1],
      font: 'var(--text-caption)',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);
