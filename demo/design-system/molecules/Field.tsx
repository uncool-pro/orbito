import { Text } from '../atoms/Text';

/** Labelled text field (static in mockups: shows a value or a placeholder). */
export const Field = ({ label, value, placeholder, hint }: { label: string; value?: string; placeholder?: string; hint?: string }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
    <Text variant="caption" tone="muted">
      {label}
    </Text>
    <span
      style={{
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-4)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)',
        font: 'var(--text-body)',
        color: value ? 'var(--color-ink)' : 'var(--color-ink-muted)',
      }}
    >
      {value ?? placeholder}
    </span>
    {hint && (
      <Text variant="caption" tone="muted">
        {hint}
      </Text>
    )}
  </label>
);
