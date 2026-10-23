import type { ReactNode } from 'react';

import { Text } from '../atoms/Text';

export type SectionTone = 'bg' | 'surface' | 'accent';

const grounds: Record<SectionTone, string> = { bg: 'var(--color-bg)', surface: 'var(--color-surface)', accent: 'var(--color-accent-soft)' };

type SectionProps = {
  /** Anchor of the section: links with `href="#<id>"` scroll here. Name it after its content (`pricing`, `faq`). */
  id?: string;
  /** Background of the whole band. */
  tone?: SectionTone;
  /** Heading of the section (an h2); leave it out only for the hero, which has its own h1. */
  title?: string;
  /** One sentence under the title. */
  lead?: string;
  /** Width of the content column in px; the band itself always spans the page. */
  width?: number;
  children?: ReactNode;
};

/**
 * One band of a web page or landing page: full width, its content in a centred column, the page padding on the sides.
 * A landing is a sequence of sections; each answers one question of the visitor.
 */
export const Section = ({ id, tone = 'bg', title, lead, width = 1120, children }: SectionProps) => (
  <section id={id} style={{ background: grounds[tone], padding: 'var(--space-8) var(--space-6)', scrollMarginTop: 'var(--space-8)' }}>
    <div style={{ maxWidth: width, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {(title || lead) && (
        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 720 }}>
          {title && <Text variant="title" as="h2">{title}</Text>}
          {lead && <Text tone="muted">{lead}</Text>}
        </header>
      )}
      {children}
    </div>
  </section>
);
