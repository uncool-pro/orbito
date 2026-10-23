import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

type TextFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  focused?: boolean;
  multiline?: boolean;
};

/** A labelled text field. Static in mockups: shows a value or a placeholder, and the state (focused, error) you set. */
export const TextField = ({ label, value, placeholder, hint, error, icon, focused, multiline }: TextFieldProps) => {
  const border = error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-line)';

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '100%' }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <span
        style={{
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 'var(--space-2)',
          minHeight: multiline ? 112 : 48,
          padding: multiline ? 'var(--space-3) var(--space-4)' : '0 var(--space-4)',
          border: `1.5px solid ${border}`,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)',
          font: 'var(--text-body)',
          color: value ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        }}
      >
        {icon && <Icon name={icon} size={20} />}
        {value ?? placeholder}
      </span>
      {(error || hint) && (
        <Text variant="caption" tone={error ? 'danger' : 'muted'}>
          {error ?? hint}
        </Text>
      )}
    </label>
  );
};
