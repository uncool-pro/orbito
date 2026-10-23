import type { CSSProperties, ElementType, ReactNode } from 'react';

export type TextVariant = 'title' | 'heading' | 'body' | 'caption';
export type TextTone = 'default' | 'muted' | 'primary' | 'warning';

const tones: Record<TextTone, string> = {
  default: 'var(--color-ink)',
  muted: 'var(--color-ink-muted)',
  primary: 'var(--color-primary)',
  warning: 'var(--color-warning)',
};
const tags: Record<TextVariant, ElementType> = { title: 'h1', heading: 'h2', body: 'p', caption: 'span' };

type TextProps = { variant?: TextVariant; tone?: TextTone; as?: ElementType; style?: CSSProperties; children: ReactNode };

/** All text in the product. Variants map 1:1 to the type tokens. */
export const Text = ({ variant = 'body', tone = 'default', as, style, children }: TextProps) => {
  const Tag = as ?? tags[variant];

  return <Tag style={{ margin: 0, font: `var(--text-${variant})`, color: tones[tone], ...style }}>{children}</Tag>;
};
