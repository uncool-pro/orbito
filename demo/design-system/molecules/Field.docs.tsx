import { defineDocs } from '@uncool-pro/orbito-core';

import { Field } from './Field';

export default defineDocs({
  component: 'Field',
  description: 'A labelled text field. In mockups it shows either a value or a placeholder; the hint explains a suggested value.',
  guidelines: {
    do: ['Label every field above the input.', 'Prefill a sensible default and say where it comes from in the hint.'],
    dont: ["Don't use the placeholder as the label."],
  },
  variants: [
    { name: 'Empty', width: 358, render: () => <Field label="Name" placeholder="e.g. Monstera" /> },
    { name: 'Filled', width: 358, render: () => <Field label="Room" value="Living room" /> },
    { name: 'With hint', width: 358, render: () => <Field label="Water every" value="7 days" hint="We suggest 7 days for this kind of plant." /> },
  ],
});
