import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { Banner } from './Banner';

export default defineDocs({
  component: 'Banner',
  description: 'A message about the whole screen or section: what happened and, if needed, what to do next.',
  guidelines: {
    do: ['Title says what happened; the text says what it means for the person.', 'At most one banner per screen.'],
    dont: ["Don't use a banner for field errors (they belong under the field)."],
  },
  variants: [
    { name: 'Info', width: 358, render: () => <Banner title="New: export to PDF">Find it in the menu of any report.</Banner> },
    { name: 'Success', width: 358, render: () => <Banner tone="success" title="Invoice sent" /> },
    { name: 'Warning with action', width: 358, render: () => <Banner tone="warning" title="2 invoices due this week" action={<Button size="sm" variant="ghost">View</Button>} /> },
    { name: 'Danger', width: 358, render: () => <Banner tone="danger" title="Payment failed">The card was declined. Try another card or contact your bank.</Banner> },
  ],
});
