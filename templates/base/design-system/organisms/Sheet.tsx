import type { ReactNode } from 'react';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';

/**
 * A bottom sheet over a dimmed screen: a short task or a set of options without leaving the screen.
 * Put it in `DeviceScreen modal={…}`. `back` on the close button returns to the screen under it.
 */
export const Sheet = ({ title, children, footer, closeTo }: { title: string; children?: ReactNode; footer?: ReactNode; closeTo?: string }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'var(--color-scrim)' }}>
    <div role="dialog" aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4) var(--space-6)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: 'var(--color-surface)', boxShadow: 'var(--shadow-overlay)' }}>
      <span aria-hidden style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 'var(--radius-pill)', background: 'var(--color-line)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1 }}>
          <Text variant="heading">{title}</Text>
        </div>
        {closeTo ? <IconButton icon="close" label="Close" to={closeTo} /> : <IconButton icon="close" label="Close" back />}
      </div>
      {children}
      {footer && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>{footer}</div>}
    </div>
  </div>
);
