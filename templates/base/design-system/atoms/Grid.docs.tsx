import { defineDocs } from '@uncool-pro/orbito-core';

import { Grid } from './Grid';
import { Text } from './Text';

const cell = (label: string) => (
  <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
    <Text>{label}</Text>
  </div>
);

export default defineDocs({
  component: 'Grid',
  description: 'Columns that adapt to the available width without media queries: as many as fit at `min` px, one column on a phone. The layout tool of web pages and landing sections.',
  guidelines: {
    do: ['Set `min` from the content: about 280px for text blocks, 200px for logos or short facts.', 'Check the page on the mobile viewport too: the grid becomes one column.'],
    dont: ["Don't nest grids to build a fixed layout; use one grid per group of equal items."],
  },
  variants: [
    { name: 'Three columns', width: 960, render: () => <Grid>{cell('First')}{cell('Second')}{cell('Third')}</Grid> },
    { name: 'On a phone', width: 358, note: 'The same grid at mobile width: one column.', render: () => <Grid>{cell('First')}{cell('Second')}{cell('Third')}</Grid> },
  ],
});
