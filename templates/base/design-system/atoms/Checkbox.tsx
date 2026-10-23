import { Icon } from './Icon';

/** A choice in a list of choices, or a confirmation. Static in mockups: `checked` sets what it shows. */
export const Checkbox = ({ checked = false, label }: { checked?: boolean; label?: string }) => (
  <span role="checkbox" aria-checked={checked} aria-label={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
    <span
      style={{
        width: 22,
        height: 22,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        borderRadius: 'var(--radius-sm)',
        border: checked ? 0 : '1.5px solid var(--color-ink-muted)',
        background: checked ? 'var(--color-accent)' : 'var(--color-surface)',
        color: 'var(--color-accent-ink)',
      }}
    >
      {checked && <Icon name="check" size={16} />}
    </span>
    {label && <span style={{ font: 'var(--text-body)', color: 'var(--color-ink)' }}>{label}</span>}
  </span>
);
