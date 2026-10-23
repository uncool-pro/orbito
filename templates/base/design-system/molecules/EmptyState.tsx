import type { ReactNode } from 'react';

import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

/** What a screen shows when there is nothing yet (or nothing found): why, and the next step (`action`). */
export const EmptyState = ({ icon = 'info', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-6) var(--space-5)', textAlign: 'center' }}>
    <span style={{ width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-pill)', background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
      <Icon name={icon} size={32} />
    </span>
    <Text variant="title" align="center">
      {title}
    </Text>
    {children && (
      <Text tone="muted" align="center">
        {children}
      </Text>
    )}
    {action}
  </div>
);
