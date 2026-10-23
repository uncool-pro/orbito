import { defineDocs } from '@uncool-pro/orbito-core';

import { Text } from './Text';

export default defineDocs({
  component: 'Text',
  description: 'All text in the product. Each variant is one type token; tone picks one of the text colours. Change the look of all text in tokens.json, not here.',
  guidelines: {
    do: ['One title per screen.', 'Secondary information: muted tone, not a smaller size.', 'Use clamp for titles that may be long (list rows, cards).'],
    dont: ["Don't set font size, weight or colour by hand: add a variant or tone instead."],
  },
  variants: [
    { name: 'Display', render: () => <Text variant="display">1 284</Text> },
    { name: 'Title', render: () => <Text variant="title">Orders</Text> },
    { name: 'Heading', render: () => <Text variant="heading">Delivery address</Text> },
    { name: 'Body', width: 320, render: () => <Text>Your order is packed and will leave the warehouse tomorrow morning.</Text> },
    { name: 'Label and caption', render: () => <div><Text variant="label" tone="muted">Email</Text><br /><Text variant="caption" tone="muted">Updated 2 min ago</Text></div> },
    { name: 'Tones', render: () => <div style={{ display: 'flex', gap: 'var(--space-3)' }}><Text tone="accent">Accent</Text><Text tone="success">Success</Text><Text tone="warning">Warning</Text><Text tone="danger">Danger</Text></div> },
  ],
});
