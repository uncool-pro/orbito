import { useLinkProps } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export type NavItem = { key: string; label: string; icon: IconName; to?: string; count?: number };

const Item = ({ item, current }: { item: NavItem; current: boolean }) => {
  const linkProps = useLinkProps(current || !item.to ? {} : { to: item.to });

  return (
    <div
      role="link"
      aria-current={current ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minHeight: 40,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        background: current ? 'var(--color-accent-soft)' : 'transparent',
        color: current ? 'var(--color-accent)' : 'var(--color-ink)',
        font: current ? 'var(--text-heading)' : 'var(--text-body)',
        cursor: current || !item.to ? undefined : 'pointer',
      }}
      {...linkProps}
    >
      <Icon name={item.icon} size={20} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count !== undefined && (
        <Text variant="caption" tone="muted">
          {item.count}
        </Text>
      )}
    </div>
  );
};

/** Main navigation of a web app: product name, sections, the current one highlighted. */
export const SideNav = ({ product, items, current, footer }: { product: string; items: NavItem[]; current: string; footer?: NavItem[] }) => (
  <aside style={{ width: 248, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-5) var(--space-3)', background: 'var(--color-surface)', borderRight: '1px solid var(--color-line)' }}>
    <div style={{ padding: '0 var(--space-3) var(--space-5)' }}>
      <Text variant="heading" tone="accent">
        {product}
      </Text>
    </div>
    {items.map((i) => (
      <Item key={i.key} item={i} current={i.key === current} />
    ))}
    {footer && (
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {footer.map((i) => (
          <Item key={i.key} item={i} current={i.key === current} />
        ))}
      </div>
    )}
  </aside>
);
