import { defineDocs } from '@uncool-pro/orbito-core';

import { SegmentedControl } from './SegmentedControl';

export default defineDocs({
  component: 'SegmentedControl',
  description: 'Switches between 2–4 views of the same content (day / week / month, list / map). Each segment can be its own screen.',
  guidelines: { do: ['Short, parallel labels.'], dont: ["Don't use it for navigation between different sections (use TabBar or SideNav)."] },
  variants: [
    { name: 'Three segments', width: 358, render: () => <SegmentedControl current={1} segments={[{ label: 'Day' }, { label: 'Week' }, { label: 'Month' }]} /> },
    { name: 'Two segments', width: 240, render: () => <SegmentedControl current={0} segments={[{ label: 'List' }, { label: 'Map' }]} /> },
  ],
});
