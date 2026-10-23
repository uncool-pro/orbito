import { Icon } from './Icon';
import type { IconName } from './Icon';

/** Stand-in for an image, video or map. Mockups use placeholders, not real photos: say what goes there with `label`. */
export const Media = ({ ratio = '16 / 9', icon = 'image', label, rounded = true }: { ratio?: string; icon?: IconName; label?: string; rounded?: boolean }) => (
  <div
    role="img"
    aria-label={label ?? 'Image'}
    style={{
      aspectRatio: ratio,
      width: '100%',
      display: 'grid',
      placeItems: 'center',
      alignContent: 'center',
      gap: 'var(--space-1)',
      borderRadius: rounded ? 'var(--radius-md)' : 0,
      background: 'var(--color-surface-muted)',
      color: 'var(--color-ink-muted)',
      font: 'var(--text-caption)',
    }}
  >
    <Icon name={icon} size={32} />
    {label}
  </div>
);
