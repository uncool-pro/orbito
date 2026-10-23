import { useLinkProps } from '@uncool-pro/orbito-runtime';
import type { LinkTarget } from '@uncool-pro/orbito-runtime';

import { Icon } from './Icon';
import type { IconName } from './Icon';

type IconButtonProps = LinkTarget & { icon: IconName; label: string; tone?: 'default' | 'accent'; filled?: boolean; badge?: boolean };

/** An icon on its own as a button (back, close, search, more). Always 44×44 and always with a label for screen readers. */
export const IconButton = ({ icon, label, tone = 'default', filled, badge, ...link }: IconButtonProps) => {
  const linkProps = useLinkProps(link);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        position: 'relative',
        display: 'inline-grid',
        placeItems: 'center',
        width: 44,
        height: 44,
        flex: 'none',
        border: 0,
        borderRadius: 'var(--radius-pill)',
        background: filled ? 'var(--color-surface-muted)' : 'transparent',
        color: tone === 'accent' ? 'var(--color-accent)' : 'var(--color-ink)',
        cursor: 'pointer',
      }}
      {...linkProps}
    >
      <Icon name={icon} />
      {badge && <span aria-hidden style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-danger)' }} />}
    </button>
  );
};
