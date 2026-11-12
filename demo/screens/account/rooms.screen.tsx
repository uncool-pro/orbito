import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, ListItem, PlantThumb } from '../../design-system';
import { rooms } from '../data';

export const meta = defineScreen({ code: 'PR-03', title: 'Profile / Rooms', back: 'profile' });

export default function Rooms() {
  return (
    <DeviceScreen
      background="var(--color-bg-glow), var(--color-bg)"
      top={<AppBar title="Rooms" back action={<Button variant="ghost" icon="plus" label="Add a room" />} />}
    >
      <div
        data-name="room-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4) var(--space-5)',
        }}
      >
        {rooms.map((r) => (
          <ListItem
            key={r.name}
            to="room-detail"
            title={r.name}
            subtitle={`${r.plants} ${r.plants === 1 ? 'plant' : 'plants'} · ${r.light}`}
            leading={<PlantThumb size={44} />}
          />
        ))}
      </div>
    </DeviceScreen>
  );
}
