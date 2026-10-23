import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from './Button';
import { Icon } from './Icon';

export default defineDocs({
  component: 'Button',
  description: 'Starts an action or opens another screen. The only pressable button in the product; every button is at least 44px high.',
  guidelines: {
    do: ['One primary button per screen area: the most likely next step.', 'Start the label with a verb: "Water now", "Save plant".', 'Use `fab` only for the main creation action of a list screen.'],
    dont: ["Don't put two primary buttons next to each other: make one secondary.", "Don't use a ghost button for a destructive action."],
  },
  variants: [
    { name: 'Primary', render: () => <Button>Save plant</Button> },
    { name: 'Primary with icon', render: () => <Button icon="drop">Water now</Button> },
    { name: 'Secondary', render: () => <Button variant="secondary">Edit</Button> },
    { name: 'Ghost', render: () => <Button variant="ghost">Skip</Button> },
    { name: 'Icon only (ghost)', note: 'Needs a label for screen readers.', render: () => <Button variant="ghost" label="Back"><Icon name="back" /></Button> },
    { name: 'Floating action', render: () => <Button variant="fab" icon="plus">Add plant</Button> },
    { name: 'Full width', width: 358, render: () => <Button full>Back to my plants</Button> },
  ],
});
