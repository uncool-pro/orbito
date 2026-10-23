import { defineDocs } from '@uncool-pro/orbito-core';

import { Checkbox } from './Checkbox';

export default defineDocs({
  component: 'Checkbox',
  description: 'Selects items from a list or confirms something in a form. Takes effect when the form is submitted.',
  guidelines: { do: ['Write the label as a positive statement: "Send me a copy".'], dont: ["Don't use a checkbox for an immediate setting (use Switch)."] },
  variants: [
    { name: 'Unchecked', render: () => <Checkbox label="Send me a copy" /> },
    { name: 'Checked', render: () => <Checkbox checked label="Send me a copy" /> },
  ],
});
