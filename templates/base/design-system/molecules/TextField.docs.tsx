import { defineDocs } from '@uncool-pro/orbito-core';

import { TextField } from './TextField';

export default defineDocs({
  component: 'TextField',
  description: 'A labelled text field. Static in mockups: it shows a value or a placeholder and the state you set (focused, error).',
  guidelines: {
    do: ['Label above every field.', 'Error text says how to fix it: "Enter an email like name@company.com".', 'Prefill sensible defaults and say why in the hint.'],
    dont: ["Don't use the placeholder as the label.", "Don't show errors before the person has finished typing."],
  },
  variants: [
    { name: 'Empty', width: 358, render: () => <TextField label="Email" placeholder="name@company.com" /> },
    { name: 'Filled', width: 358, render: () => <TextField label="Company" value="Northwind Ltd" /> },
    { name: 'Focused with hint', width: 358, render: () => <TextField label="Phone" value="+48 500" focused hint="We only call about deliveries." /> },
    { name: 'Error', width: 358, render: () => <TextField label="Email" value="ada@" error="Enter an email like name@company.com" /> },
    { name: 'Multiline', width: 358, render: () => <TextField label="Note for the courier" placeholder="Gate code, floor…" multiline /> },
  ],
});
