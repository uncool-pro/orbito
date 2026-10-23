import { defineDocs } from '@uncool-pro/orbito-core';

import { Media } from './Media';

export default defineDocs({
  component: 'Media',
  description: 'Stand-in for an image, video, chart or map. Mockups show what goes there, not a real photo: say it in `label`.',
  guidelines: { do: ['Keep the real aspect ratio of the content (16/9 video, 1/1 product photo).'], dont: ["Don't paste stock photos into mockups: they distract reviewers from the flow."] },
  variants: [
    { name: 'Wide 16/9', width: 320, render: () => <Media label="Product photo" /> },
    { name: 'Square', width: 120, render: () => <Media ratio="1 / 1" /> },
    { name: 'Chart', width: 320, render: () => <Media icon="chart" ratio="2 / 1" label="Revenue, last 30 days" /> },
  ],
});
