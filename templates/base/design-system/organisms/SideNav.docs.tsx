import { defineDocs } from '@uncool-pro/orbito-core';

import { SideNav } from './SideNav';

export default defineDocs({
  component: 'SideNav',
  description: 'Main navigation of a web app: product name, sections with the current one highlighted, account items at the bottom.',
  guidelines: { do: ['5–8 sections; group the rest under one section.', 'Counts only where they drive action (unread, to do).'], dont: ["Don't nest more than one level."] },
  variants: [
    {
      name: 'Default',
      render: () => (
        <div style={{ display: 'flex', height: 420 }}>
          <SideNav
            product="Northwind"
            current="orders"
            items={[
              { key: 'home', label: 'Dashboard', icon: 'home', to: 'start' },
              { key: 'orders', label: 'Orders', icon: 'mail', count: 12 },
              { key: 'customers', label: 'Customers', icon: 'user', to: 'start' },
              { key: 'reports', label: 'Reports', icon: 'chart', to: 'start' },
            ]}
            footer={[{ key: 'settings', label: 'Settings', icon: 'settings', to: 'start' }]}
          />
        </div>
      ),
    },
  ],
});
