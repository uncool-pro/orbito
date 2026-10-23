import type { ReactNode } from 'react';

import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';

/** Top bar of a screen: optional back button, title, optional action on the right. */
export const AppBar = ({ title, back, action }: { title: string; back?: boolean; action?: ReactNode }) => (
  <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', minHeight: 56, padding: '0 var(--space-2)', background: 'var(--color-bg)' }}>
    {back && (
      <Button variant="ghost" back label="Back">
        <Icon name="back" />
      </Button>
    )}
    <div style={{ flex: 1, paddingLeft: back ? 0 : 'var(--space-2)' }}>
      <Text variant="title">{title}</Text>
    </div>
    {action}
  </header>
);
