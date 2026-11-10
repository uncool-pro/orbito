import { Glass } from '../atoms/Glass';

const Bar = ({ width, strong = false }: { width: string; strong?: boolean }) => (
  <i
    style={{
      display: 'block',
      width,
      height: strong ? 12 : 9,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-skeleton)',
      opacity: strong ? 1 : 0.7,
    }}
  />
);

/**
 * A stand-in for content that is not designed yet: a glass card with grey bars, in the look of the product, so a
 * placeholder screen still reads as part of the app.
 */
export const Skeleton = ({
  lines = 2,
  leading = false,
  tall = false,
}: {
  lines?: number;
  leading?: boolean;
  tall?: boolean;
}) => (
  <Glass
    style={{
      display: 'flex',
      alignItems: tall ? 'flex-start' : 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      minHeight: tall ? 140 : undefined,
    }}
  >
    {leading && (
      <span
        style={{
          flex: 'none',
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-skeleton)',
        }}
      />
    )}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Bar width="55%" strong />
      {Array.from({ length: Math.max(0, lines - 1) }, (_, i) => (
        <Bar key={i} width={i % 2 ? '60%' : '85%'} />
      ))}
    </div>
  </Glass>
);
