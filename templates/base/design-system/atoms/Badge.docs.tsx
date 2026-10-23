import { defineDocs } from '@uncool-pro/orbito-core';

import { Badge } from './Badge';

export default defineDocs({
  component: 'Badge',
  description: 'A short status or count next to something else. Not pressable.',
  guidelines: {
    do: ['One or two words: "Paid", "Overdue", "3 new".', 'Same status = same tone everywhere in the product.'],
    dont: ["Don't use badges as buttons or filters (use Chip)."],
  },
  variants: [
    { name: 'Tones', render: () => <div style={{ display: 'flex', gap: 'var(--space-2)' }}><Badge>Draft</Badge><Badge tone="accent">New</Badge><Badge tone="success">Paid</Badge><Badge tone="warning">Due soon</Badge><Badge tone="danger">Overdue</Badge></div> },
  ],
});
