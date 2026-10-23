import { Icon } from './Icon';

/** A person: initials on a tinted circle (mockups never use real photos of people). */
export const Avatar = ({ name, size = 40 }: { name?: string; size?: number }) => {
  const initials = name
    ?.split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-label={name}
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-accent-soft)',
        color: 'var(--color-accent)',
        font: size >= 56 ? 'var(--text-title)' : 'var(--text-label)',
      }}
    >
      {initials || <Icon name="user" size={Math.round(size * 0.55)} />}
    </span>
  );
};
