import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from './Button';

export default defineDocs({
  component: 'Button',
  description: 'Starts an action or opens another screen (`to`, `back`). The only button in the product; the default size is 44px high, the minimum touch target.',
  guidelines: {
    do: ['One primary button per screen area: the most likely next step.', 'Start the label with a verb: "Save", "Send invoice".', 'Floating: only for the main creation action of a list screen.'],
    dont: ["Don't place two primary buttons side by side: make one secondary or ghost.", "Don't use ghost for destructive actions; use danger and confirm with a Dialog."],
  },
  variants: [
    { name: 'Primary', render: () => <Button>Save</Button> },
    { name: 'Secondary', render: () => <Button variant="secondary">Edit</Button> },
    { name: 'Ghost', render: () => <Button variant="ghost">Cancel</Button> },
    { name: 'Danger', render: () => <Button variant="danger" icon="trash">Delete</Button> },
    { name: 'With icons', render: () => <Button icon="plus" iconEnd="down">New</Button> },
    { name: 'Small', render: () => <Button size="sm" variant="secondary">Filter</Button> },
    { name: 'Floating', render: () => <Button variant="floating" icon="plus">New order</Button> },
    { name: 'Disabled', note: 'Say why near the button; a disabled button alone does not explain anything.', render: () => <Button disabled>Continue</Button> },
    { name: 'Link to a section', note: 'With `href` the button is a real link: `#id` scrolls to a section of the page, a full address leaves the site. Pages exported as a static site use only these.', render: () => <Button href="#pricing">See pricing</Button> },
    { name: 'Full width', width: 358, render: () => <Button full>Continue</Button> },
  ],
});
