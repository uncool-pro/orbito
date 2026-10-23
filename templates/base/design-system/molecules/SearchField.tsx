import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';

/** Search input. On a list screen it can open a dedicated search screen (`to`). */
export const SearchField = ({ placeholder = 'Search', value, ...link }: LinkTarget & { placeholder?: string; value?: string }) => {
  const linkProps = useLinkProps(link);

  return (
    <div
      role="search"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        minHeight: 44,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-surface-muted)',
        color: value ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        font: 'var(--text-body)',
        cursor: link.to ? 'pointer' : undefined,
      }}
      {...linkProps}
    >
      <Icon name="search" size={20} />
      {value ?? placeholder}
    </div>
  );
};
