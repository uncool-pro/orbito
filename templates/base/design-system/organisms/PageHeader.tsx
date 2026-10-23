import type { ReactNode } from 'react';

import { Text } from '../atoms/Text';

/** Top of a web page: optional breadcrumb, the title, a one-line description and the page's actions on the right. */
export const PageHeader = ({ title, description, breadcrumb, actions }: { title: string; description?: string; breadcrumb?: ReactNode; actions?: ReactNode }) => (
  <header style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
    <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {breadcrumb && (
        <Text variant="label" tone="muted">
          {breadcrumb}
        </Text>
      )}
      <Text variant="title">{title}</Text>
      {description && <Text tone="muted">{description}</Text>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 'var(--space-2)' }}>{actions}</div>}
  </header>
);
