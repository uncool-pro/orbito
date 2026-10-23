import { useLinkProps } from '@uncool-pro/orbito-runtime';

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

/** App navigation. The current tab is not a link, so the board draws no arrow from a screen to itself. */
export const TabBar = ({ current }: { current: TabKey }) => (
  <nav role="tablist" style={{ display: 'flex', borderTop: '1px solid var(--color-line)', background: 'var(--color-surface)', paddingBottom: 'var(--space-5)' }}>
    {tabs.map((t) => (
      <Tab key={t.key} tab={t} current={t.key === current} />
    ))}
  </nav>
);
