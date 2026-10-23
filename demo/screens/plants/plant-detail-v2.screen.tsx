import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Icon, PlantThumb, Text } from '../../design-system';

export const meta = defineScreen({
  code: 'PL-02·A',
  title: 'Plants / Detail (after UX review)',
  back: 'plant-list',
  requirements: ['REQ-03'],
  note: 'Version after the October UX review: watering status moves to the top (finding #1), one primary action (finding #2).',
});

export default function PlantDetailV2() {
  return (
    <DeviceScreen
      background="var(--color-bg)"
      top={<AppBar title="Monstera" back action={<Button variant="ghost" to="add-plant">Edit</Button>} />}
      bottom={
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-6)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-line)' }}>
          <Button full icon="drop" to="watered">
            Water now
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
          <Icon name="drop" size={32} />
          <div>
            <Text variant="title" tone="warning">
              Water today
            </Text>
            <Text variant="caption" tone="muted">
              Last watered 8 days ago · every 7 days
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <PlantThumb size={88} />
          <div>
            <Text variant="heading">Living room</Text>
            <Text variant="caption" tone="muted">
              Bright, indirect light
            </Text>
          </div>
        </div>
        <Text variant="heading">Care notes</Text>
        <Text tone="muted">Let the top 3 cm of soil dry out between waterings. Wipe the leaves once a month.</Text>
      </div>
    </DeviceScreen>
  );
}
