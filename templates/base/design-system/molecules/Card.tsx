import type { ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Text } from '../atoms/Text';

type CardProps = LinkTarget & {
  title?: string;
  subtitle?: string;
  /** Top visual, usually Media. */
  media?: ReactNode;
  /** Right side of the header: Badge, IconButton. */
  aside?: ReactNode;
  /** Remove inner padding (for lists of ListItem flush rows). */
  bare?: boolean;
  children?: ReactNode;
};

/** A group of related content on its own surface. The whole card can open a screen (`to`). */
export const Card = ({ title, subtitle, media, aside, bare, children, ...link }: CardProps) => {
  const linkProps = useLinkProps(link);

  return (
    <section
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-line)', cursor: link.to ? 'pointer' : undefined }}
      {...linkProps}
    >
      {media}
      {(title || aside) && (
        <header style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-4) 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-half)' }}>
            {title && <Text variant="heading">{title}</Text>}
            {subtitle && (
              <Text variant="caption" tone="muted">
                {subtitle}
              </Text>
            )}
          </div>
          {aside}
        </header>
      )}
      {children && <div style={{ padding: bare ? 'var(--space-2) 0' : 'var(--space-3) var(--space-4) var(--space-4)' }}>{children}</div>}
    </section>
  );
};
