import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen, Transition } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Icon, PlantThumb, Text } from '../../design-system';

export const meta = defineScreen({ code: 'PL-02', title: 'Plants / Detail', back: 'plant-list', requirements: ['REQ-03'] });

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-half)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)' }}>
    <Text variant="caption" tone="muted">
      {label}
    </Text>
    <Text variant="heading">{value}</Text>
  </div>
);

export default function PlantDetail() {
  return (
    <DeviceScreen
      background="var(--color-bg)"
      top={<AppBar title="Monstera" back />}
      bottom={
        <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4) var(--space-6)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-line)' }}>
          <Button variant="secondary" to="add-plant">
            Edit
          </Button>
          <Button full icon="drop" to="watered">
            Water now
          </Button>
        </div>
      }
    >
      <Transition to="plant-offline" on="error" label="Watering failed: no connection" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'grid', placeItems: 'center', height: 220, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)' }}>
          <PlantThumb size={120} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Fact label="Room" value="Living room" />
          <Fact label="Light" value="Bright, indirect" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
          <Icon name="drop" />
          <div>
            <Text variant="heading" tone="warning">
              Water today
            </Text>
            <Text variant="caption" tone="muted">
              Last watered 8 days ago · every 7 days
            </Text>
          </div>
        </div>
        <Text variant="heading">Care notes</Text>
        <Text tone="muted">Let the top 3 cm of soil dry out between waterings. Wipe the leaves once a month. Turn the pot a quarter every week so it grows evenly.</Text>
        <Text variant="heading">History</Text>
        {['12 Oct · watered', '5 Oct · watered', '1 Oct · fertilised', '28 Sep · watered'].map((h) => (
          <Text key={h} tone="muted">
            {h}
          </Text>
        ))}
      </div>
    </DeviceScreen>
  );
}
