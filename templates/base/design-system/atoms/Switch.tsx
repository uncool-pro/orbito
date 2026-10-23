/** On/off setting that applies immediately. Static in mockups: `on` sets what it shows. */
export const Switch = ({ on = false, label }: { on?: boolean; label: string }) => (
  <span
    role="switch"
    aria-checked={on}
    aria-label={label}
    style={{
      position: 'relative',
      display: 'inline-block',
      width: 48,
      height: 28,
      flex: 'none',
      borderRadius: 'var(--radius-pill)',
      background: on ? 'var(--color-accent)' : 'var(--color-line)',
      transition: 'background var(--motion-fast) var(--ease-out)',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 22,
        height: 22,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-raised)',
        transition: 'left var(--motion-fast) var(--ease-out)',
      }}
    />
  </span>
);
