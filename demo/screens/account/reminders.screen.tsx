import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Icon, ListItem, Text } from '../../design-system';
import { reminders } from '../data';

export const meta = defineScreen({ code: 'PR-02', title: 'Profile / Set reminders', back: 'profile' });

export default function Reminders() {
  return (
    <DeviceScreen
      background="var(--color-bg-glow), var(--color-bg)"
      top={<AppBar title="Reminders" back />}
      bottom={
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-6)' }}>
          <Button full icon="check" back>
            Save reminders
          </Button>
        </div>
      }
    >
      <div
        data-name="reminder-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4) var(--space-5)',
        }}
      >
        <Text tone="muted">Leafy reminds you only when a plant needs you.</Text>
        {reminders.map((r) => (
          <ListItem
            key={r.title}
            title={r.title}
            subtitle={r.when}
            leading={<Icon name="sun" />}
            trailing={
              <Text variant="caption" tone="primary">
                On
              </Text>
            }
          />
        ))}
      </div>
    </DeviceScreen>
  );
}
