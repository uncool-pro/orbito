import { defineDocs } from '@uncool-pro/orbito-core';

import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Switch } from '../atoms/Switch';
import { ListItem } from './ListItem';

export default defineDocs({
  component: 'ListItem',
  description: 'A row in a list: leading visual, title, optional subtitle, trailing meta or control. When it opens a screen (`to`), the whole row is the target and it shows a chevron.',
  guidelines: {
    do: ['Title on one line; details in the subtitle.', 'The same leading visual type within one list.', 'Inside a Card use `flush` rows with inset Dividers.'],
    dont: ["Don't put buttons inside a row that opens a screen.", "Don't combine a chevron with a Switch: a row either navigates or toggles."],
  },
  variants: [
    { name: 'Opens a screen', width: 358, render: () => <ListItem title="Ada Nowak" subtitle="Last order 12 Oct" leading={<Avatar name="Ada Nowak" />} to="start" /> },
    { name: 'With status', width: 358, render: () => <ListItem title="Invoice 2026/10/14" subtitle="Due 24 Oct" leading={<Icon name="mail" />} trailing={<Badge tone="warning">Due soon</Badge>} /> },
    { name: 'Setting', width: 358, render: () => <ListItem title="Email notifications" subtitle="Order updates and receipts" leading={<Icon name="bell" />} trailing={<Switch on label="Email notifications" />} /> },
  ],
});
