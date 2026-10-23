import { defineDocs } from '@uncool-pro/orbito-core';

import { IconButton } from './IconButton';

export default defineDocs({
  component: 'IconButton',
  description: 'An icon on its own as a button: back, close, search, more. Always 44×44 and always with a label for screen readers.',
  guidelines: {
    do: ['Use only for actions people recognise from the icon alone (back, close, search, more).'],
    dont: ["Don't use it for the main action of a screen: that needs a Button with text."],
  },
  variants: [
    { name: 'Default', render: () => <IconButton icon="more" label="More options" /> },
    { name: 'Accent', render: () => <IconButton icon="search" label="Search" tone="accent" /> },
    { name: 'Filled', render: () => <IconButton icon="close" label="Close" filled /> },
    { name: 'With badge', note: 'Something new behind it.', render: () => <IconButton icon="bell" label="Notifications" badge /> },
  ],
});
