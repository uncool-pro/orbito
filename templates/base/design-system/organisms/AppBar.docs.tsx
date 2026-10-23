import { defineDocs } from '@uncool-pro/orbito-core';

import { IconButton } from '../atoms/IconButton';
import { AppBar } from './AppBar';

export default defineDocs({
  component: 'AppBar',
  description: 'Top of a mobile screen. Tab root screens get a large title; nested screens get back, a compact title and up to two actions.',
  guidelines: {
    do: ['Back on every screen that is not a tab root.', 'At most two actions; more go into a "more" menu.'],
    dont: ["Don't repeat the tab name as the title of a nested screen."],
  },
  variants: [
    { name: 'Tab root (large)', width: 390, render: () => <AppBar title="Orders" actions={<IconButton icon="search" label="Search" />} /> },
    { name: 'Nested (compact)', width: 390, render: () => <AppBar title="Order 1042" back actions={<IconButton icon="more" label="More" />} /> },
  ],
});
