import { defineDocs } from '@uncool-pro/orbito-core';

import { Chip } from './Chip';

export default defineDocs({
  component: 'Chip',
  description: 'A filter or one choice among several. The selected one is tinted and ticked.',
  guidelines: { do: ['Keep labels to one or two words.', 'Put a row of chips under the search, scrolling sideways if needed.'], dont: ["Don't use chips for actions (use Button)."] },
  variants: [
    { name: 'Filter row', width: 358, render: () => <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}><Chip label="All" selected /><Chip label="Paid" /><Chip label="Overdue" /><Chip label="Date" icon="calendar" /></div> },
  ],
});
