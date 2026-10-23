import type { ReactNode } from 'react';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';

type AppBarProps = {
  title: string;
  /** Show a back button (nested screens). */
  back?: boolean;
  /** Up to two IconButtons on the right. */
  actions?: ReactNode;
  /** `large`: tab root screens, big title under the bar. `compact`: nested screens, centred-left title in the bar. */
  size?: 'compact' | 'large';
};

/** Top of a mobile screen: back on nested screens, the title, up to two actions. */
export const AppBar = ({ title, back, actions, size = back ? 'compact' : 'large' }: AppBarProps) => (
  <header style={{ background: 'var(--color-bg)', padding: '0 var(--space-2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', minHeight: 52 }}>
      {back && <IconButton icon="back" label="Back" back />}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: back ? 0 : 'var(--space-2)' }}>
        {size === 'compact' && (
          <Text variant="heading" clamp={1}>
            {title}
          </Text>
        )}
      </div>
      {actions}
    </div>
    {size === 'large' && (
      <div style={{ padding: '0 var(--space-2) var(--space-2)' }}>
        <Text variant="title">{title}</Text>
      </div>
    )}
  </header>
);
