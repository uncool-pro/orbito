/** A hairline between groups of content. Use space first; a divider only when space alone does not separate. */
export const Divider = ({ inset = false }: { inset?: boolean }) => (
  <hr style={{ margin: 0, marginLeft: inset ? 'var(--space-4)' : 0, border: 0, borderTop: '1px solid var(--color-line)' }} />
);
