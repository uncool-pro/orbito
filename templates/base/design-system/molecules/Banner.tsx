import type { ReactNode } from 'react';

import { Icon } from '../atoms/Icon';
import type { IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const look: Record<BannerTone, { bg: string; tone: 'accent' | 'success' | 'warning' | 'danger'; icon: IconName }> = {
  info: { bg: 'var(--color-accent-soft)', tone: 'accent', icon: 'info' },
  success: { bg: 'var(--color-success-soft)', tone: 'success', icon: 'check' },
  warning: { bg: 'var(--color-warning-soft)', tone: 'warning', icon: 'alert' },
  danger: { bg: 'var(--color-danger-soft)', tone: 'danger', icon: 'alert' },
};

/** A message about the whole screen or section: what happened and, optionally, what to do (`action`, usually a small Button). */
export const Banner = ({ tone = 'info', title, children, action }: { tone?: BannerTone; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div role={tone === 'danger' ? 'alert' : 'status'} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: look[tone].bg }}>
    <Text tone={look[tone].tone} as="span" style={{ display: 'flex' }}>
      <Icon name={look[tone].icon} size={20} />
    </Text>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-half)' }}>
      <Text variant="heading" tone={look[tone].tone}>
        {title}
      </Text>
      {children && <Text variant="caption">{children}</Text>}
    </div>
    {action}
  </div>
);
