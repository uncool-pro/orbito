import type { ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';

type ListItemProps = LinkTarget & {
  title: string;
  subtitle?: string;
  /** Visual at the start: Icon, Avatar, Media thumbnail. */
  leading?: ReactNode;
  /** Meta or control at the end: Badge, Switch, a value. */
  trailing?: ReactNode;
  /** Rows inside a Card sit flush; standalone rows get their own surface. */
  flush?: boolean;
};

/** A row in a list. When it opens another screen the whole row is the target and it shows a chevron. */
export const ListItem = ({ title, subtitle, leading, trailing, flush, ...link }: ListItemProps) => {
  const linkProps = useLinkProps(link);
  const pressable = !!(link.to || link.back);

  return (
    <div
      role={pressable ? 'button' : undefined}
      tabIndex={pressable ? 0 : undefined}
      aria-label={pressable ? title : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minHeight: 56,
        padding: 'var(--space-3) var(--space-4)',
        background: flush ? 'transparent' : 'var(--color-surface)',
        borderRadius: flush ? 0 : 'var(--radius-md)',
        cursor: pressable ? 'pointer' : undefined,
      }}
      {...linkProps}
    >
      {leading && <span style={{ display: 'flex', color: 'var(--color-ink-muted)' }}>{leading}</span>}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-half)' }}>
        <Text variant="heading" clamp={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted" clamp={2}>
            {subtitle}
          </Text>
        )}
      </div>
      {trailing}
      {link.to && (
        <span style={{ display: 'flex', color: 'var(--color-ink-muted)' }}>
          <Icon name="chevron" size={18} />
        </span>
      )}
    </div>
  );
};
