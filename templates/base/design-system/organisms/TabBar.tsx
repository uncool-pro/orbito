import { useLinkProps } from '@uncool-pro/orbito-runtime';

import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export type Tab = { key: string; label: string; icon: IconName; to: string; badge?: boolean };

const TabItem = ({ tab, current }: { tab: Tab; current: boolean }) => {
  const linkProps = useLinkProps(current ? {} : { to: tab.to });

  return (
    <div
      role="tab"
      aria-selected={current}
      aria-label={tab.label}
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-half)',
        padding: 'var(--space-2) 0',
        color: current ? 'var(--color-accent)' : 'var(--color-ink-muted)',
        cursor: current ? undefined : 'pointer',
      }}
      {...linkProps}
    >
      <Icon name={tab.icon} />
      {tab.badge && <span aria-hidden style={{ position: 'absolute', top: 6, left: '56%', width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-danger)' }} />}
      <Text variant="caption" tone={current ? 'accent' : 'muted'}>
        {tab.label}
      </Text>
    </div>
  );
};

/** Main app navigation, 3–5 tabs, on tab root screens only. The current tab is not a link (no arrow to itself on the board). */
export const TabBar = ({ tabs, current }: { tabs: Tab[]; current: string }) => (
  <nav role="tablist" style={{ display: 'flex', borderTop: '1px solid var(--color-line)', background: 'var(--color-surface)', paddingBottom: 'var(--space-5)' }}>
    {tabs.map((t) => (
      <TabItem key={t.key} tab={t} current={t.key === current} />
    ))}
  </nav>
);
