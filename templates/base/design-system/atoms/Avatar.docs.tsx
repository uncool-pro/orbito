import { defineDocs } from '@uncool-pro/orbito-core';

import { Avatar } from './Avatar';

export default defineDocs({
  component: 'Avatar',
  description: 'A person, shown as initials on a tinted circle. Mockups never use real photos of people.',
  guidelines: { do: ['40px in lists, 32px in dense tables, 72px on a profile.'], dont: ["Don't use avatars for things that are not people (use Media or Icon)."] },
  variants: [
    { name: 'Sizes', render: () => <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}><Avatar name="Ada Nowak" size={32} /><Avatar name="Ada Nowak" /><Avatar name="Ada Nowak" size={72} /></div> },
    { name: 'No name', render: () => <Avatar /> },
  ],
});
