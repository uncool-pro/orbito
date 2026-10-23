import { defineDocs } from '@uncool-pro/orbito-core';

import { TabBar } from './TabBar';

export default defineDocs({
  component: 'TabBar',
  description: 'Main navigation of the app: three tabs, always at the bottom of tab root screens. The current tab is highlighted and is not a link.',
  guidelines: {
    do: ['Show it only on the three root screens.'],
    dont: ["Don't add a fourth tab without revisiting the information architecture."],
  },
  variants: [
    { name: 'Plants', width: 390, render: () => <TabBar current="plants" /> },
    { name: 'Schedule', width: 390, render: () => <TabBar current="schedule" /> },
    { name: 'Profile', width: 390, render: () => <TabBar current="profile" /> },
  ],
});
