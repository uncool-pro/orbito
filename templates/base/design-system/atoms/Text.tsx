import type { CSSProperties, ElementType, ReactNode } from 'react';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
export type TextTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'inverse';

const tones: Record<TextTone, string> = {
  default: 'var(--color-ink)',
  muted: 'var(--color-ink-muted)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  inverse: 'var(--color-accent-ink)',
};
const tags: Record<TextVariant, ElementType> = { display: 'h1', title: 'h1', heading: 'h2', body: 'p', label: 'span', caption: 'span' };

type TextProps = { variant?: TextVariant; tone?: TextTone; as?: ElementType; align?: 'start' | 'center' | 'end'; clamp?: number; style?: CSSProperties; children: ReactNode };

/** All text in the product. Each variant is one type token; tone picks one of the text colours. */
export const Text = ({ variant = 'body', tone = 'default', as, align, clamp, style, children }: TextProps) => {
  const Tag = as ?? tags[variant];
  const clamped: CSSProperties = clamp ? { display: '-webkit-box', WebkitLineClamp: clamp, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {};

  return <Tag style={{ margin: 0, font: `var(--text-${variant})`, color: tones[tone], textAlign: align, ...clamped, ...style }}>{children}</Tag>;
};
