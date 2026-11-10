import type { CSSProperties, ReactNode } from 'react';

/**
 * A frosted-glass surface over the screen's glow: cards, list rows, the tab bar. The blur is what makes it glass, so keep
 * it on surfaces that sit over the background, not on top of other glass.
 */
export const Glass = ({
  radius = 'md',
  style,
  children,
}: {
  radius?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    style={{
      background: 'var(--color-glass)',
      backdropFilter: 'blur(18px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      border: '1px solid var(--color-glass-line)',
      borderRadius: `var(--radius-${radius})`,
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}
  >
    {children}
  </div>
);
