import { definePage } from '@uncool-pro/orbito-core';

export default definePage({
  key: 'account',
  name: 'Schedule & profile',
  flows: [
    { key: 'A1', name: 'Plan the week', screens: ['plant-list', 'schedule', 'plant-detail', 'profile'] },
    { key: 'A2', name: 'Set reminders', screens: ['profile', 'reminders', 'profile'] },
    { key: 'A3', name: 'Organise rooms', screens: ['profile', 'rooms', 'room-detail'] },
    { key: 'A4', name: 'Invite a plant sitter', screens: ['profile', 'sitter-invite', 'sitter-sent'] },
  ],
});
