import { defineScreen } from '@uncool-pro/orbito-core';
import { PageScreen } from '@uncool-pro/orbito-runtime';

import { Button, Icon, ListItem, PlantThumb, Text } from '../../design-system';
import { plants } from '../data';

export const meta = defineScreen({ code: 'AD-01', title: 'Admin / Dashboard', viewport: 'desktop', requirements: ['REQ-10'] });

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div style={{ flex: 1, padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
    <Text variant="caption" tone="muted">
      {label}
    </Text>
    <Text variant="title">{value}</Text>
  </div>
);

// the side navigation stays in place while the dashboard scrolls: it goes into `side`, not into the content
const SideNav = () => (
  <nav style={{ width: 240, height: '100%', boxSizing: 'border-box', padding: 'var(--space-5)', background: 'var(--color-surface)', borderRight: '1px solid var(--color-line)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    <Text variant="title" tone="primary">
      Leafy admin
    </Text>
    <Text variant="heading">Dashboard</Text>
    <Text tone="muted">Plant catalogue</Text>
    <Text tone="muted">Users</Text>
  </nav>
);

export default function AdminDashboard() {
  return (
    <PageScreen background="var(--color-bg)" side={<SideNav />}>
      <div>
        <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="title">Good morning</Text>
            <Button icon="leaf" to="admin-catalog">
              Open plant catalogue
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Stat label="Active users" value="12 480" />
            <Stat label="Plants tracked" value="58 213" />
            <Stat label="Reminders sent today" value="9 732" />
          </div>
          <Text variant="heading">Most added this week</Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {[...plants, ...plants].map((p, i) => (
              <ListItem key={`${p.id}-${i}`} title={p.name} subtitle={p.room} leading={<PlantThumb size={40} />} trailing={<Icon name="chevron" size={18} />} />
            ))}
          </div>
        </main>
      </div>
    </PageScreen>
  );
}
