import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { Chip } from '../molecules/Chip';
import { Sheet } from './Sheet';

export default defineDocs({
  component: 'Sheet',
  description: 'A bottom sheet over a dimmed screen: a short task or a set of options without leaving the screen. Used as `DeviceScreen modal={<Sheet …/>}`, usually on its own screen in the flow.',
  guidelines: {
    do: ['Keep it short: if it scrolls a lot, it should be a screen.', 'One primary action at the bottom.'],
    dont: ["Don't stack a sheet on a sheet."],
  },
  variants: [
    {
      name: 'Filters',
      width: 390,
      render: () => (
        <div style={{ position: 'relative', height: 360 }}>
          <Sheet title="Filter orders" footer={<Button full>Show 24 orders</Button>}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Chip label="Paid" selected />
              <Chip label="Unpaid" />
              <Chip label="This week" selected />
            </div>
          </Sheet>
        </div>
      ),
    },
  ],
});
