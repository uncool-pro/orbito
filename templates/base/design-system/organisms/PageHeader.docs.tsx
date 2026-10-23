import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { PageHeader } from './PageHeader';

export default defineDocs({
  component: 'PageHeader',
  description: 'Top of a web page: breadcrumb on nested pages, the title, one line of description and the page actions on the right.',
  guidelines: { do: ['One primary action at most; the rest secondary.'], dont: ["Don't repeat the section name from the SideNav as a breadcrumb on top-level pages."] },
  variants: [
    { name: 'Top-level page', width: 720, render: () => <PageHeader title="Orders" description="All orders from the shop and the marketplace." actions={<><Button variant="secondary" icon="filter">Filter</Button><Button icon="plus">New order</Button></>} /> },
    { name: 'Nested page', width: 720, render: () => <PageHeader breadcrumb="Orders / 1042" title="Order 1042" actions={<Button variant="secondary" icon="edit">Edit</Button>} /> },
  ],
});
