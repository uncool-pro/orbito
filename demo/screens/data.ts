/** Fictional data for the mockups. */
export const plants = [
  { id: 'monstera', name: 'Monstera', room: 'Living room', next: 'Water today', due: true },
  { id: 'ficus', name: 'Ficus lyrata', room: 'Bedroom', next: 'Water in 2 days', due: false },
  { id: 'calathea', name: 'Calathea', room: 'Bathroom', next: 'Mist today', due: true },
  { id: 'pothos', name: 'Golden pothos', room: 'Kitchen', next: 'Water in 4 days', due: false },
  { id: 'snake', name: 'Snake plant', room: 'Hallway', next: 'Water in 9 days', due: false },
  { id: 'aloe', name: 'Aloe vera', room: 'Office', next: 'Water in 12 days', due: false },
  { id: 'fern', name: 'Boston fern', room: 'Balcony', next: 'Water tomorrow', due: false },
  { id: 'zz', name: 'ZZ plant', room: 'Office', next: 'Water in 15 days', due: false },
];

export const tasks = [
  { day: 'Today', items: ['Water Monstera', 'Mist Calathea'] },
  { day: 'Tomorrow', items: ['Water Boston fern'] },
  { day: 'Thursday', items: ['Water Ficus lyrata', 'Rotate Snake plant'] },
  { day: 'Saturday', items: ['Water Golden pothos'] },
];
