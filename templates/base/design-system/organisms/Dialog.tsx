import type { ReactNode } from 'react';

import { Text } from '../atoms/Text';

/**
 * A decision that must be made before going on (confirm delete, discard changes). Centred over a dimmed screen.
 * Put it in `DeviceScreen modal={…}` or `PageScreen modal={…}`. Actions: one primary, one ghost "Cancel".
 */
export const Dialog = ({ title, children, actions }: { title: string; children?: ReactNode; actions: ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 'var(--space-5)', background: 'var(--color-scrim)' }}>
    <div role="alertdialog" aria-label={title} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-overlay)' }}>
      <Text variant="title">{title}</Text>
      {children && <Text tone="muted">{children}</Text>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>{actions}</div>
    </div>
  </div>
);
