import type { ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';

type ListItemProps = LinkTarget & { title: string; subtitle?: string; leading?: ReactNode; trailing?: ReactNode };

/** A row in a list: leading visual, two lines of text, trailing meta. Shows a chevron when it opens another screen. */
export const ListItem = ({ title, subtitle, leading, trailing, ...link }: ListItemProps) => {
  const linkProps = useLinkProps(link);
  const pressable = !!(link.to || link.back);

  return (
    <div
      role={pressable ? 'button' : undefined}
      tabIndex={pressable ? 0 : undefined}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        cursor: pressable ? 'pointer' : undefined,
      }}
      {...linkProps}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-half)' }}>
        <Text variant="heading">{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </div>
      {trailing}
      {link.to && (
        <span style={{ color: 'var(--color-ink-muted)', display: 'flex' }}>
          <Icon name="chevron" size={18} />
        </span>
      )}
    </div>
  );
};
