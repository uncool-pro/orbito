import type { ReactNode } from 'react';
import { useLinkProps } from '@uncool-pro/orbito-runtime';

import { Text } from '../atoms/Text';

export type Column = { key: string; label: string; align?: 'start' | 'end'; width?: number | string };
export type Row = { id: string; cells: Record<string, ReactNode>; to?: string };

const RowView = ({ row, columns }: { row: Row; columns: Column[] }) => {
  const linkProps = useLinkProps(row.to ? { to: row.to } : {});

  return (
    <tr style={{ cursor: row.to ? 'pointer' : undefined }} {...linkProps}>
      {columns.map((c) => (
        <td key={c.key} style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-line)', textAlign: c.align === 'end' ? 'right' : 'left', font: 'var(--text-body)', color: 'var(--color-ink)' }}>
          {row.cells[c.key]}
        </td>
      ))}
    </tr>
  );
};

/** Rows of records with the same fields (web). A row can open its detail screen (`to`). Numbers align to the end. */
export const DataTable = ({ columns, rows, caption }: { columns: Column[]; rows: Row[]; caption?: string }) => (
  <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-line)', background: 'var(--color-surface)' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {caption && (
        <caption style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)' }}>
          <Text variant="heading">{caption}</Text>
        </caption>
      )}
      <thead>
        <tr style={{ background: 'var(--color-surface-muted)' }}>
          {columns.map((c) => (
            <th key={c.key} style={{ width: c.width, padding: 'var(--space-2) var(--space-4)', textAlign: c.align === 'end' ? 'right' : 'left', font: 'var(--text-label)', color: 'var(--color-ink-muted)' }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <RowView key={r.id} row={r} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);
