import { defineDocs } from '@uncool-pro/orbito-core';

import { Badge } from '../atoms/Badge';
import { Divider } from '../atoms/Divider';
import { Media } from '../atoms/Media';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { ListItem } from './ListItem';

export default defineDocs({
  component: 'Card',
  description: 'A group of related content on its own surface: a summary, a set of rows, a product. The whole card can open a screen (`to`).',
  guidelines: {
    do: ['One topic per card, with a title that names it.', 'For a list inside a card use `bare` and flush ListItems.'],
    dont: ["Don't nest cards in cards.", "Don't make a card pressable and also put buttons in it."],
  },
  variants: [
    { name: 'Summary', width: 358, render: () => <Card title="This month" subtitle="1–19 October" aside={<Badge tone="success">+12%</Badge>}><Text variant="display">48 210 zł</Text></Card> },
    { name: 'With media, opens a screen', width: 358, render: () => <Card media={<Media rounded={false} label="Product photo" />} title="Desk lamp" subtitle="In stock · 189 zł" to="start" /> },
    { name: 'List inside', width: 358, render: () => <Card title="Recent customers" bare><ListItem flush title="Ada Nowak" subtitle="2 orders" /><Divider inset /><ListItem flush title="Jan Kowalski" subtitle="5 orders" /></Card> },
  ],
});
