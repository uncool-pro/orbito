import { definePage } from '@uncool-pro/orbito-core';

export default definePage({
  key: 'account',
  name: 'Schedule & profile',
  flows: [{ key: 'A1', name: 'Plan the week', screens: ['plant-list', 'schedule', 'plant-detail', 'profile'] }],
});
