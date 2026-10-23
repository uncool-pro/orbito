import type { CSSProperties, ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from './Icon';
import type { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'floating';
export type ButtonSize = 'md' | 'sm';

const looks: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-accent)', color: 'var(--color-accent-ink)' },
  secondary: { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' },
  ghost: { background: 'transparent', color: 'var(--color-accent)' },
  danger: { background: 'var(--color-danger)', color: 'var(--color-accent-ink)' },
  floating: { background: 'var(--color-accent)', color: 'var(--color-accent-ink)', boxShadow: 'var(--shadow-raised)', minHeight: 56, padding: '0 var(--space-5)' },
};

type ButtonProps = LinkTarget & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
  full?: boolean;
  disabled?: boolean;
  label?: string;
  children?: ReactNode;
};

/**
 * Starts an action or opens another screen (`to` / `back`). With `href` it is a real link (a section of the page, `#id`,
 * or another site) and renders an `<a>`. The only button in the product; `md` is 44px high (touch target).
 */
export const Button = ({ variant = 'primary', size = 'md', icon, iconEnd, full, disabled, label, children, ...link }: ButtonProps) => {
  const linkProps = useLinkProps(disabled ? {} : link);
  const As = link.href && !disabled ? 'a' : 'button';

  return (
    <As
      type={As === 'button' ? 'button' : undefined}
      aria-label={label}
      disabled={As === 'button' ? disabled : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        minHeight: size === 'md' ? 44 : 32,
        minWidth: size === 'md' ? 44 : 32,
        padding: size === 'md' ? '0 var(--space-4)' : '0 var(--space-3)',
        width: full ? '100%' : undefined,
        border: 0,
        borderRadius: 'var(--radius-pill)',
        font: size === 'md' ? 'var(--text-heading)' : 'var(--text-label)',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform var(--motion-fast) var(--ease-out)',
        ...looks[variant],
      }}
      {...linkProps}
    >
      {icon && <Icon name={icon} size={size === 'md' ? 20 : 16} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'md' ? 20 : 16} />}
    </As>
  );
};
