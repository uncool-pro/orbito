import { defineDocs } from '@uncool-pro/orbito-core';

import { Skeleton } from './Skeleton';

export default defineDocs({
  component: 'Skeleton',
  description:
    'Stand-in for content that is not designed yet, in the look of the product: placeholder screens stay part of the app on the board.',
  guidelines: {
    do: [
      'Mark the screen as a placeholder in its title and note.',
      'Keep the real structure: a list of rows is a column of skeletons with a leading box.',
    ],
    dont: ["Don't leave skeletons on a screen people already reviewed as designed."],
  },
  variants: [
    { name: 'Row', width: 360, render: () => <Skeleton leading /> },
    { name: 'Text block', width: 360, render: () => <Skeleton lines={4} /> },
    { name: 'Tall card', width: 360, render: () => <Skeleton lines={3} tall /> },
  ],
});
