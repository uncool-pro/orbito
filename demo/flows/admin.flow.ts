import { definePage } from '@uncool-pro/orbito-core';

export default definePage({
  key: 'admin',
  name: 'Admin (web)',
  flows: [{ key: 'W1', name: 'Manage the catalogue', screens: ['admin-dashboard', 'admin-catalog'] }],
});
