import { defineDocs } from '@uncool-pro/orbito-core';

import { Icon } from './Icon';
import type { IconName } from './Icon';

const all: IconName[] = ['leaf', 'drop', 'calendar', 'user', 'plus', 'back', 'search', 'check', 'sun', 'chevron'];

export default defineDocs({
  component: 'Icon',
  description: 'Line icons on a 24px grid, 1.8px stroke, coloured by the surrounding text colour.',
  guidelines: {
    do: ['Pair an icon with a text label, or give it a `label` when it stands alone.'],
    dont: ["Don't scale icons below 16px or mix in filled icons."],
  },
  variants: [
    {
      name: 'Set',
      render: () => (
        <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-ink)' }}>
          {all.map((n) => (
            <Icon key={n} name={n} label={n} />
          ))}
        </div>
      ),
    },
    { name: 'Sizes 16 · 24 · 48', render: () => <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'end', color: 'var(--color-primary)' }}><Icon name="leaf" size={16} /><Icon name="leaf" /><Icon name="leaf" size={48} /></div> },
  ],
});
