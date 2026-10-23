import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Field, PlantThumb, Text } from '../../design-system';

export const meta = defineScreen({ code: 'PL-04', title: 'Plants / Add plant', back: 'plant-list', requirements: ['REQ-04'] });

export default function AddPlant() {
  return (
    <DeviceScreen
      background="var(--color-bg)"
      top={<AppBar title="Add plant" back />}
      bottom={
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-6)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-line)' }}>
          <Button full to="plant-list">
            Save plant
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <PlantThumb size={72} />
          <Button variant="secondary">Add photo</Button>
        </div>
        <Field label="Name" placeholder="e.g. Monstera" />
        <Field label="Room" value="Living room" />
        <Field label="Water every" value="7 days" hint="We suggest 7 days for this kind of plant." />
        <Field label="Light" value="Bright, indirect" />
        <Text variant="caption" tone="muted">
          You can change all of this later.
        </Text>
      </div>
    </DeviceScreen>
  );
}
