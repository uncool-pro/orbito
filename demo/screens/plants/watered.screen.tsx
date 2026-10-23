import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen, Transition } from '@uncool-pro/orbito-runtime';

import { Button, Icon, Text } from '../../design-system';

export const meta = defineScreen({ code: 'PL-03', title: 'Plants / Watered (success)', back: 'plant-detail', requirements: ['REQ-03'] });

export default function Watered() {
  return (
    <DeviceScreen background="var(--color-bg)">
      <Transition to="plant-list" on="auto" after={4000} label="Back to the list after 4 s" />
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <span style={{ width: 96, height: 96, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
          <Icon name="check" size={48} />
        </span>
        <Text variant="title">Monstera is happy</Text>
        <Text tone="muted">Next watering in 7 days. We will remind you on Tuesday morning.</Text>
        <Button full to="plant-list">
          Back to my plants
        </Button>
      </div>
    </DeviceScreen>
  );
}
