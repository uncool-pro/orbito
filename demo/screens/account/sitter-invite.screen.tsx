import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Button, Field, Skeleton } from '../../design-system';

export const meta = defineScreen({
  code: 'PR-05',
  title: 'Profile / Invite a plant sitter (placeholder)',
  back: 'profile',
  note: 'Placeholder: only the main action is decided.',
});

export default function SitterInvite() {
  return (
    <DeviceScreen
      background="var(--color-bg-glow), var(--color-bg)"
      top={<AppBar title="Plant sitter" back />}
      bottom={
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-6)' }}>
          <Button full icon="user" to="sitter-sent">
            Send invite
          </Button>
        </div>
      }
    >
      <div
        data-name="sitter-form"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-4) var(--space-5)',
        }}
      >
        <Skeleton lines={3} />
        <Field label="Their email" placeholder="name@example.com" />
        <Skeleton leading />
        <Skeleton leading />
      </div>
    </DeviceScreen>
  );
}
