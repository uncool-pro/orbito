import { defineDocs } from '@uncool-pro/orbito-core';

import { Divider } from './Divider';

export default defineDocs({
  component: 'Divider',
  description: 'A hairline between groups of content. Space separates first; a divider only when space alone is not enough.',
  guidelines: { do: ['Inset dividers between rows that share a leading visual.'], dont: ["Don't put a divider above or below a Card: the card edge already separates."] },
  variants: [
    { name: 'Full', width: 320, render: () => <Divider /> },
    { name: 'Inset', width: 320, render: () => <Divider inset /> },
  ],
});
