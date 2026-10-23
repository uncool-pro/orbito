import { defineDocs } from '@uncool-pro/orbito-core';

import { SearchField } from './SearchField';

export default defineDocs({
  component: 'SearchField',
  description: 'Search input. On a list screen it usually opens a dedicated search screen (`to`).',
  guidelines: { do: ['Say what can be found: "Search orders or customers".'], dont: ["Don't hide search behind an icon when searching is the main task of the screen."] },
  variants: [
    { name: 'Empty', width: 358, render: () => <SearchField placeholder="Search orders or customers" /> },
    { name: 'With query', width: 358, render: () => <SearchField value="Northwind" /> },
  ],
});
