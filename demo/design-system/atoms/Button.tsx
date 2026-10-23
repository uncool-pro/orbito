import type { CSSProperties, ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from './Icon';
import type { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'fab';

const looks: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: 'var(--color-primary-ink)' },
  secondary: { background: 'var(--color-primary-soft)', color: 'var(--color-primary)' },
  ghost: { background: 'transparent', color: 'var(--color-primary)', padding: '0 var(--space-2)' },
  fab: { background: 'var(--color-primary)', color: 'var(--color-primary-ink)', boxShadow: 'var(--shadow-raised)', minHeight: 56, padding: '0 var(--space-5)' },
};

type ButtonProps = LinkTarget & { variant?: ButtonVariant; icon?: IconName; full?: boolean; label?: string; children?: ReactNode };

/** The only pressable button. Pass `to` / `back` to make it a prototype link. Minimum height 44px (touch target). */
export const Button = ({ variant = 'primary', icon, full, label, children, ...link }: ButtonProps) => {
  const linkProps = useLinkProps(link);

  return (
    <button
      type="button"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        minHeight: 44,
        minWidth: 44,
        padding: '0 var(--space-4)',
        width: full ? '100%' : undefined,
        border: 0,
        borderRadius: 'var(--radius-pill)',
        font: 'var(--text-heading)',
        cursor: 'pointer',
        ...looks[variant],
      }}
      {...linkProps}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
};
