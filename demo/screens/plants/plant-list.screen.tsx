import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Icon, ListItem, PlantThumb, TabBar, Text } from '../../design-system';
import { plants } from '../data';

export const meta = defineScreen({ code: 'PL-01', title: 'Plants / List', requirements: ['REQ-01', 'REQ-02'] });

export default function PlantList() {
  return (
    <DeviceScreen
      background="var(--color-bg)"
      top={<AppBar title="My plants" action={<Button variant="ghost" icon="search" label="Search" />} />}
      bottom={<TabBar current="plants" />}
      overlay={
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-4)' }}>
          <Button variant="fab" icon="plus" to="add-plant">
            Add plant
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4) var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
          <Icon name="drop" size={20} />
          <Text variant="heading" tone="warning">
            2 plants need you today
          </Text>
        </div>
        {plants.map((p) => (
          <ListItem key={p.id} to="plant-detail" title={p.name} subtitle={`${p.room} · ${p.next}`} leading={<PlantThumb tone={p.due ? 'warning' : 'primary'} />} />
        ))}
      </div>
    </DeviceScreen>
  );
}
