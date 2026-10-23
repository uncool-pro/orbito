import { Icon } from '../atoms/Icon';

/** Placeholder plant photo: a tinted square with the leaf icon (mockups never use real photos). */
export const PlantThumb = ({ size = 52, tone = 'primary' }: { size?: number; tone?: 'primary' | 'warning' }) => (
  <span
    style={{
      width: size,
      height: size,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-sm)',
      background: tone === 'primary' ? 'var(--color-primary-soft)' : 'var(--color-warning-soft)',
      color: tone === 'primary' ? 'var(--color-primary)' : 'var(--color-warning)',
    }}
  >
    <Icon name="leaf" size={Math.round(size * 0.5)} />
  </span>
);
