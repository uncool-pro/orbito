import { definePage } from '@uncool-pro/orbito-core';

// Placeholder page from the project template. Replace it with the product's real pages and flows.
export default definePage({
  key: 'start',
  name: 'Start',
  flows: [{ key: 'S1', name: 'Next steps', screens: ['start'] }],
});
