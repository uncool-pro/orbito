import type { ReactNode } from 'react';

import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';

type DisclosureProps = {
  /** The question or label, always visible. */
  title: string;
  /** Open at start. */
  open?: boolean;
  children: ReactNode;
};

/**
 * A question with a hidden answer (FAQ, details). Built on the native `<details>`, so it opens and closes without
 * scripts: on the board, in the prototype and in a static export alike.
 */
export const Disclosure = ({ title, open, children }: DisclosureProps) => (
  <details open={open} style={{ borderBottom: '1px solid var(--color-line)' }}>
    <summary style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0', cursor: 'pointer', listStyle: 'none' }}>
      <span style={{ flex: '1 1 auto' }}>
        <Text variant="heading" as="span">
          {title}
        </Text>
      </span>
      <Icon name="down" size={20} />
    </summary>
    <div style={{ paddingBottom: 'var(--space-4)' }}>
      <Text tone="muted">{children}</Text>
    </div>
  </details>
);
