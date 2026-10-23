import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { AppBar } from './AppBar';

export default defineDocs({
  component: 'AppBar',
  description: 'Top of every mobile screen: back button on nested screens, the screen title, one optional action on the right.',
  guidelines: {
    do: ['Show back on every screen that is not a tab root.', 'Keep at most one action; more go into the screen content.'],
    dont: ["Don't repeat the tab name as the title of a nested screen."],
  },
  variants: [
    { name: 'Tab root', width: 390, render: () => <AppBar title="My plants" /> },
    { name: 'Nested', width: 390, render: () => <AppBar title="Monstera" back /> },
    { name: 'With action', width: 390, render: () => <AppBar title="Monstera" back action={<Button variant="ghost">Edit</Button>} /> },
  ],
});
