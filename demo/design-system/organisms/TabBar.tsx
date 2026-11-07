import { useLinkProps } from '@uncool-pro/orbito-runtime';

import { Glass } from '../atoms/Glass';
import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

type TabKey = 'plants' | 'schedule' | 'profile';

const tabs: { key: TabKey; label: string; icon: IconName; to: string }[] = [
  { key: 'plants', label: 'Plants', icon: 'leaf', to: 'plant-list' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar', to: 'schedule' },
  { key: 'profile', label: 'Profile', icon: 'user', to: 'profile' },
];

const Tab = ({ tab, current }: { tab: (typeof tabs)[number]; current: boolean }) => {
  const linkProps = useLinkProps(current ? {} : { to: tab.to });

  return (
    <div
      role="tab"
      aria-selected={current}
      aria-label={tab.label}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-half)',
        padding: 'var(--space-2) 0',
        borderRadius: 'var(--radius-md)',
        background: current ? 'var(--color-primary-soft)' : 'transparent',
        color: current ? 'var(--color-primary)' : 'var(--color-ink-muted)',
        cursor: 'pointer',
      }}
      {...linkProps}
    >
      <Icon name={tab.icon} />
      <Text variant="caption" tone={current ? 'primary' : 'muted'}>
        {tab.label}
      </Text>
    </div>
  );
};

/**
 * App navigation, floating on glass above the bottom edge. The current tab is highlighted and is not a link, so the board
 * draws no arrow from a screen to itself.
 */
export const TabBar = ({ current }: { current: TabKey }) => (
  <div style={{ padding: '0 var(--space-4) var(--space-5)' }}>
    <Glass radius="lg" style={{ padding: 'var(--space-1)' }}>
      <nav role="tablist" style={{ display: 'flex', gap: 'var(--space-1)' }}>
        {tabs.map((t) => (
          <Tab key={t.key} tab={t} current={t.key === current} />
        ))}
      </nav>
    </Glass>
  </div>
);
