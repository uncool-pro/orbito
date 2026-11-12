import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Icon, ListItem, TabBar, Text } from '../../design-system';

export const meta = defineScreen({ code: 'PR-01', title: 'Profile / Overview' });

export default function Profile() {
  return (
    <DeviceScreen
      background="var(--color-bg-glow), var(--color-bg)"
      top={<AppBar title="Profile" />}
      bottom={<TabBar current="profile" />}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4) var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
          <span
            style={{
              width: 64,
              height: 64,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              background: 'var(--color-hero)',
              color: 'var(--color-primary-ink)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            <Icon name="user" size={32} />
          </span>
          <div>
            <Text variant="title">Alex Green</Text>
            <Text variant="caption" tone="muted">
              8 plants · member since March
            </Text>
          </div>
        </div>
        <ListItem title="Reminders" subtitle="Every morning at 8:00" leading={<Icon name="sun" />} to="reminders" />
        <ListItem title="Rooms" subtitle="6 rooms" leading={<Icon name="leaf" />} to="rooms" />
        <ListItem
          title="Plant sitter"
          subtitle="Someone to water while you are away"
          leading={<Icon name="user" />}
          to="sitter-invite"
        />
        <ListItem title="Watering history" leading={<Icon name="calendar" />} to="schedule" />
      </div>
    </DeviceScreen>
  );
}
