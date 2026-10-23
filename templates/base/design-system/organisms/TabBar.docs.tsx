import { defineDocs } from '@uncool-pro/orbito-core';

import { TabBar } from './TabBar';
import type { Tab } from './TabBar';

const tabs: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home', to: 'start' },
  { key: 'orders', label: 'Orders', icon: 'mail', to: 'start', badge: true },
  { key: 'profile', label: 'Profile', icon: 'user', to: 'start' },
];

export default defineDocs({
  component: 'TabBar',
  description: 'Main navigation of a mobile app: 3–5 tabs at the bottom of tab root screens. The current tab is highlighted and is not a link.',
  guidelines: {
    do: ['Show it only on tab root screens, not on nested ones.', 'Labels of one word.'],
    dont: ["Don't add a sixth tab: revisit the information architecture instead."],
  },
  variants: [
    { name: 'Three tabs', width: 390, render: () => <TabBar tabs={tabs} current="home" /> },
    { name: 'Second tab, with badge', width: 390, render: () => <TabBar tabs={tabs} current="orders" /> },
  ],
});
