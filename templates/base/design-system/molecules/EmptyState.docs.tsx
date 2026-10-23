import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { EmptyState } from './EmptyState';

export default defineDocs({
  component: 'EmptyState',
  description: 'What a screen shows when there is nothing yet or nothing was found: why, and the next step.',
  guidelines: {
    do: ['Every list screen gets an empty state: design it, it is often the first thing new users see.', 'Offer the action that fills the screen.'],
    dont: ["Don't just say \"No data\"."],
  },
  variants: [
    { name: 'First use', width: 358, render: () => <EmptyState icon="mail" title="No invoices yet" action={<Button icon="plus">Create invoice</Button>}>Invoices you create or import will appear here.</EmptyState> },
    { name: 'Nothing found', width: 358, render: () => <EmptyState icon="search" title="Nothing found">Try a shorter name or clear the filters.</EmptyState> },
  ],
});
