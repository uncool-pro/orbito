import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Icon, ListItem, TabBar, Text } from '../../design-system';
import { tasks } from '../data';

export const meta = defineScreen({ code: 'SC-01', title: 'Schedule / Week', requirements: ['REQ-05'] });

export default function Schedule() {
  return (
    <DeviceScreen background="var(--color-bg)" top={<AppBar title="This week" />} bottom={<TabBar current="schedule" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        {tasks.map((d) => (
          <section key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Text variant="caption" tone="muted">
              {d.day.toUpperCase()}
            </Text>
            {d.items.map((item) => (
              <ListItem key={item} to="plant-detail" title={item} leading={<Icon name="drop" />} />
            ))}
          </section>
        ))}
      </div>
    </DeviceScreen>
  );
}
