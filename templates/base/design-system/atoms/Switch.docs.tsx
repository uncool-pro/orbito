import { defineDocs } from '@uncool-pro/orbito-core';

import { Switch } from './Switch';

export default defineDocs({
  component: 'Switch',
  description: 'An on/off setting that applies immediately, without a Save button. Usually the trailing part of a ListItem.',
  guidelines: { do: ['Label says what is on: "Email notifications".'], dont: ["Don't use a switch inside a form that has a Save button (use Checkbox)."] },
  variants: [
    { name: 'Off', render: () => <Switch label="Notifications" /> },
    { name: 'On', render: () => <Switch on label="Notifications" /> },
  ],
});
