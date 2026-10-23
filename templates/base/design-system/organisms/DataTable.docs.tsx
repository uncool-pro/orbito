import { defineDocs } from '@uncool-pro/orbito-core';

import { Badge } from '../atoms/Badge';
import { DataTable } from './DataTable';

export default defineDocs({
  component: 'DataTable',
  description: 'Records with the same fields, compared side by side (web). A row can open its detail page. Numbers and amounts align to the end.',
  guidelines: {
    do: ['First column identifies the record.', 'Status as a Badge.', 'Show 10–25 realistic rows in mockups, including long values.'],
    dont: ["Don't use a table on mobile: use ListItem rows."],
  },
  variants: [
    {
      name: 'Orders',
      width: 720,
      render: () => (
        <DataTable
          columns={[
            { key: 'id', label: 'Order' },
            { key: 'customer', label: 'Customer' },
            { key: 'status', label: 'Status' },
            { key: 'total', label: 'Total', align: 'end' },
          ]}
          rows={[
            { id: '1', to: 'start', cells: { id: '1042', customer: 'Ada Nowak', status: <Badge tone="success">Paid</Badge>, total: '189,00 zł' } },
            { id: '2', cells: { id: '1041', customer: 'Northwind Ltd', status: <Badge tone="warning">Unpaid</Badge>, total: '2 450,00 zł' } },
            { id: '3', cells: { id: '1040', customer: 'Jan Kowalski', status: <Badge tone="danger">Overdue</Badge>, total: '76,50 zł' } },
          ]}
        />
      ),
    },
  ],
});
