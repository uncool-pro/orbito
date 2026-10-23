import { defineDocs } from '@uncool-pro/orbito-core';

import { Icon, ICON_NAMES } from './Icon';

export default defineDocs({
  component: 'Icon',
  description: 'Line icons on a 24px grid with a 1.8px stroke, coloured by the text around them. New icons go into Icon.tsx in the same style.',
  guidelines: {
    do: ['Pair an icon with a text label; alone, give it a `label` (or use IconButton).', 'Use 20px inside buttons and fields, 24px elsewhere.'],
    dont: ["Don't mix in filled icons or icons from other sets.", "Don't use an icon as the only signal of a state (add text or colour)."],
  },
  variants: [
    { name: 'Set', width: 360, render: () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', color: 'var(--color-ink)' }}>{ICON_NAMES.map((n) => <Icon key={n} name={n} label={n} />)}</div> },
    { name: 'Sizes 16 · 20 · 24 · 32', render: () => <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'end', color: 'var(--color-accent)' }}><Icon name="star" size={16} /><Icon name="star" size={20} /><Icon name="star" /><Icon name="star" size={32} /></div> },
  ],
});
