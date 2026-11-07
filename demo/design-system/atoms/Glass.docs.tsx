import { defineDocs } from '@uncool-pro/orbito-core';

import { Glass } from './Glass';
import { Text } from './Text';

export default defineDocs({
  component: 'Glass',
  description: 'A frosted-glass surface over the screen glow: cards, list rows, the tab bar.',
  guidelines: {
    do: ['Put it straight on the screen background, where the glow shows through.', 'Use radius md for cards, lg for the tab bar.'],
    dont: ["Don't stack glass on glass: the blur turns to mud.", "Don't put long text on it without enough contrast behind."],
  },
  variants: [
    {
      name: 'Card',
      render: () => (
        <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-glow), var(--color-bg)' }}>
          <Glass style={{ padding: 'var(--space-4)' }}>
            <Text variant="heading">Monstera</Text>
            <Text variant="caption" tone="muted">
              Living room · Water today
            </Text>
          </Glass>
        </div>
      ),
    },
    {
      name: 'Large radius',
      render: () => (
        <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-glow), var(--color-bg)' }}>
          <Glass radius="lg" style={{ padding: 'var(--space-4)' }}>
            <Text>Tab bar surface</Text>
          </Glass>
        </div>
      ),
    },
  ],
});
