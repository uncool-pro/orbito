import { definePage } from '@uncool-pro/orbito-core';

export default definePage({
  key: 'plants',
  name: 'Plants',
  flows: [
    {
      key: 'P1',
      name: 'Water a plant',
      path: 'happy',
      screens: ['plant-list', 'plant-detail', 'watered'],
      versions: [
        {
          key: 'ux-audit',
          name: 'After UX audit',
          date: '2026-10-19',
          state: 'open',
          report: 'reviews/2026-10-ux-audit.md',
          screens: [{ id: 'plant-detail-v2', replaces: 'plant-detail', findings: [1, 2] }],
        },
      ],
    },
    { key: 'P2', name: 'Add a plant', path: 'happy', screens: ['plant-list', 'add-plant', 'plant-list'] },
    { key: 'P3', name: 'Water from the weekly schedule', path: 'alternative', screens: ['schedule', 'plant-detail', 'watered'] },
    { key: 'P4', name: 'Watering fails offline', path: 'negative', screens: ['plant-detail', 'plant-offline', 'watered'] },
  ],
});
