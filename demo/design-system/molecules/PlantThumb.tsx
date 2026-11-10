import { Icon } from '../atoms/Icon';

/**
 * Placeholder plant photo (mockups never use real photos): a tinted tile with the leaf icon. `hero` is the big, lush
 * version for a plant's own screen.
 */
export const PlantThumb = ({
  size = 52,
  tone = 'primary',
}: {
  size?: number;
  tone?: 'primary' | 'warning' | 'hero';
}) => (
  <span
    style={{
      width: size,
      height: size,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: size >= 100 ? 'var(--radius-lg)' : 'var(--radius-sm)',
      background:
        tone === 'hero'
          ? 'var(--color-hero)'
          : tone === 'primary'
            ? 'var(--color-primary-soft)'
            : 'var(--color-warning-soft)',
      color:
        tone === 'hero'
          ? 'var(--color-primary-ink)'
          : tone === 'primary'
            ? 'var(--color-primary)'
            : 'var(--color-warning)',
      boxShadow: tone === 'hero' ? 'var(--shadow-raised)' : undefined,
    }}
  >
    <Icon name="leaf" size={Math.round(size * 0.5)} />
  </span>
);
