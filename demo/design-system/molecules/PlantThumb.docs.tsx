import { defineDocs } from '@uncool-pro/orbito-core';

import { PlantThumb } from './PlantThumb';

export default defineDocs({
  component: 'PlantThumb',
  description: 'Stand-in for a plant photo. Mockups never use real photos; the tone shows whether the plant needs attention today.',
  guidelines: { do: ['Use the warning tone only when an action is due today.'] },
  variants: [
    { name: 'Default 52', render: () => <PlantThumb /> },
    { name: 'Needs attention', render: () => <PlantThumb tone="warning" /> },
    { name: 'Large 120', render: () => <PlantThumb size={120} /> },
  ],
});
