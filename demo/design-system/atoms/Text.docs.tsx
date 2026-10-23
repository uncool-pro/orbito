import { defineDocs } from '@uncool-pro/orbito-core';

import { Text } from './Text';

export default defineDocs({
  component: 'Text',
  description: 'All text in the product. Each variant is one type token; tone picks one of the text colours.',
  guidelines: {
    do: ['One title per screen.', 'Use muted tone for secondary information, never a smaller size of body text.'],
    dont: ["Don't set font sizes or colours by hand: add a variant or tone instead."],
  },
  variants: [
    { name: 'Title', render: () => <Text variant="title">My plants</Text> },
    { name: 'Heading', render: () => <Text variant="heading">Care notes</Text> },
    { name: 'Body', width: 320, render: () => <Text>Let the top 3 cm of soil dry out between waterings.</Text> },
    { name: 'Caption, muted', render: () => <Text variant="caption" tone="muted">Living room · Water today</Text> },
    { name: 'Primary tone', render: () => <Text variant="heading" tone="primary">Plants</Text> },
    { name: 'Warning tone', render: () => <Text variant="heading" tone="warning">2 plants need you today</Text> },
  ],
});
