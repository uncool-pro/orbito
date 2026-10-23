import { useLinkProps } from '@uncool-pro/orbito-runtime';

type Segment = { label: string; to?: string };

const SegmentItem = ({ s, current }: { s: Segment; current: boolean }) => {
  const linkProps = useLinkProps(current || !s.to ? {} : { to: s.to });

  return (
    <span
      role="tab"
      aria-selected={current}
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        minHeight: 36,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-pill)',
        background: current ? 'var(--color-surface)' : 'transparent',
        boxShadow: current ? 'var(--shadow-raised)' : undefined,
        color: current ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        font: 'var(--text-label)',
        whiteSpace: 'nowrap',
        cursor: current ? undefined : 'pointer',
      }}
      {...linkProps}
    >
      {s.label}
    </span>
  );
};

/** Switches between 2–4 views of the same content. Each segment can be its own screen (`to`). */
export const SegmentedControl = ({ segments, current }: { segments: Segment[]; current: number }) => (
  <div role="tablist" style={{ display: 'flex', gap: 'var(--space-half)', padding: 'var(--space-half)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-muted)' }}>
    {segments.map((s, i) => (
      <SegmentItem key={s.label} s={s} current={i === current} />
    ))}
  </div>
);
