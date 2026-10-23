import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';

/** A filter or a choice among several; `selected` shows the active one. */
export const Chip = ({ label, selected, icon, ...link }: LinkTarget & { label: string; selected?: boolean; icon?: IconName }) => {
  const linkProps = useLinkProps(link);

  return (
    <span
      role="button"
      aria-pressed={selected}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        minHeight: 36,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-pill)',
        border: selected ? '1.5px solid var(--color-accent)' : '1px solid var(--color-line)',
        background: selected ? 'var(--color-accent-soft)' : 'var(--color-surface)',
        color: selected ? 'var(--color-accent)' : 'var(--color-ink)',
        font: 'var(--text-label)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
      {...linkProps}
    >
      {(icon || selected) && <Icon name={icon ?? 'check'} size={16} />}
      {label}
    </span>
  );
};
