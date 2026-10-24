import { defineScreen } from '@uncool-pro/orbito-core';
import { PageScreen } from '@uncool-pro/orbito-runtime';

import { Button, ListItem, PlantThumb, Text } from '../../design-system';
import { plants } from '../data';

export const meta = defineScreen({ code: 'AD-02', title: 'Admin / Plant catalogue', viewport: 'desktop', back: 'admin-dashboard', requirements: ['REQ-11'] });

export default function AdminCatalog() {
  return (
    // the header stays at the top while the long list scrolls under it
    <PageScreen
      background="var(--color-bg)"
      top={
        <header style={{ padding: 'var(--space-3) var(--space-6)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="ghost" back icon="back">
            Dashboard
          </Button>
          <Text variant="title">Plant catalogue</Text>
        </header>
      }
    >
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Text tone="muted">Care templates used when someone adds a plant. Changes apply to new plants only.</Text>
        {[...plants, ...plants].map((p, i) => (
          <ListItem key={`${p.id}-${i}`} title={p.name} subtitle={`Template · ${p.next.replace('today', 'every 7 days')}`} leading={<PlantThumb size={44} />} />
        ))}
      </main>
    </PageScreen>
  );
}
