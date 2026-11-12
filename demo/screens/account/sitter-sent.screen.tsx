import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { Button, PlantThumb, Skeleton, Text } from '../../design-system';

export const meta = defineScreen({
  code: 'PR-06',
  title: 'Profile / Invite sent (placeholder)',
  back: 'profile',
  note: 'Placeholder: the success message is not written yet.',
});

export default function SitterSent() {
  return (
    <DeviceScreen background="var(--color-bg-glow), var(--color-bg)">
      <div
        data-name="invite-sent"
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        <PlantThumb size={120} tone="hero" />
        <Text variant="title">Invite sent</Text>
        <div style={{ alignSelf: 'stretch' }}>
          <Skeleton lines={2} />
        </div>
        <Button full to="profile">
          Back to profile
        </Button>
      </div>
    </DeviceScreen>
  );
}
