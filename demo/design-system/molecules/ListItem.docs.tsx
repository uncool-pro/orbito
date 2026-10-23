import { defineDocs } from '@uncool-pro/orbito-core';

import { Icon } from '../atoms/Icon';
import { ListItem } from './ListItem';
import { PlantThumb } from './PlantThumb';

export default defineDocs({
  component: 'ListItem',
  description: 'A row in a list: leading visual, a title, an optional subtitle and trailing meta. When it opens another screen it shows a chevron and the whole row is the target.',
  guidelines: {
    do: ['Keep the title to one line; put the details in the subtitle.', 'Use the same leading visual type within one list.'],
    dont: ["Don't put buttons inside a row that is itself a link."],
  },
  variants: [
    { name: 'Opens a screen', width: 358, render: () => <ListItem title="Monstera" subtitle="Living room · Water today" leading={<PlantThumb tone="warning" />} to="plant-detail" /> },
    { name: 'Static with icon', width: 358, render: () => <ListItem title="Reminders" subtitle="Every morning at 8:00" leading={<Icon name="sun" />} /> },
    { name: 'Title only', width: 358, render: () => <ListItem title="Water Monstera" leading={<Icon name="drop" />} to="plant-detail" /> },
  ],
});
