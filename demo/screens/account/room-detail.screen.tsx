import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Skeleton } from '../../design-system';

export const meta = defineScreen({ code: 'PR-04', title: 'Profile / Room (placeholder)', back: 'rooms', note: 'Placeholder: the room screen is not designed yet.' });

export default function RoomDetail() {
  return (
    <DeviceScreen background="var(--color-bg-glow), var(--color-bg)" top={<AppBar title="Living room" back />}>
      <div data-name="room-placeholder" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        <Skeleton lines={3} tall />
        <Skeleton leading />
        <Skeleton leading />
        <Skeleton leading />
      </div>
    </DeviceScreen>
  );
}
