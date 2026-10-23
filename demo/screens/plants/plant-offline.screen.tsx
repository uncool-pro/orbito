import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Icon, Text } from '../../design-system';

export const meta = defineScreen({
  code: 'PL-05',
  title: 'Plants / Watering failed (offline)',
  back: 'plant-detail',
  requirements: ['REQ-03'],
  note: 'Negative path: the watering could not be saved because the phone is offline. Nothing is lost: the app retries.',
});

export default function PlantOffline() {
  return (
    <DeviceScreen background="var(--color-bg)" top={<AppBar title="Monstera" back />}>
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <span style={{ width: 96, height: 96, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
          <Icon name="drop" size={48} />
        </span>
        <Text variant="title">No connection</Text>
        <Text tone="muted">We could not save the watering. We will try again as soon as you are online, or you can retry now.</Text>
        <Button full to="watered">
          Try again
        </Button>
        <Button variant="ghost" back>
          Back to Monstera
        </Button>
      </div>
    </DeviceScreen>
  );
}
