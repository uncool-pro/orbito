// Orbito's logo is always the whole wordmark "orbito" (source: /assets/orbito-wordmark.svg), never its "o" alone. Inline it
// takes the colour of the text around it (currentColor), so it is dark on light surfaces and white on dark ones.
const VIEW_BOX = '34 62 680 196';
const STROKES = [
  'M167.5 164.6 A59.5 59.5 0 1 1 124.4 122.3',
  'M210 249 V110 M210 168.5 A48.5 48.5 0 0 1 258.5 120 H272',
  'M302 70 V249',
  'M461 110 V249',
  'M510 86 V204.5 A35 35 0 0 0 545 239.5 H558 M488 120.5 H556',
];
const RINGS = [361.5, 638];
const DOTS: [number, number, number][] = [
  [158.4, 131.6, 21],
  [461, 86, 13.5],
];

/**
 * The browser tab's icon: the only place the "o" with its moon stands alone, because the wordmark does not fit in 16 px.
 * A project that sets its own icon in `index.html` keeps it.
 */
export const setFavicon = () => {
  if (typeof document === 'undefined' || document.querySelector('link[rel~="icon"]')) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="36 106 148 148"><path d="${STROKES[0]}" fill="none" stroke="#111" stroke-width="21"/><circle cx="158.4" cy="131.6" r="21" fill="#111"/></svg>`;
  const link = document.createElement('link');

  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.appendChild(link);
};

export const OrbitoWordmark =({ className, title = 'Orbito' }: { className?: string; title?: string }) => (
  <svg className={className} viewBox={VIEW_BOX} role="img" aria-label={title}>
    <g fill="none" stroke="currentColor" strokeWidth="21">
      {STROKES.map((d) => (
        <path key={d} d={d} />
      ))}
      {RINGS.map((cx) => (
        <circle key={cx} cx={cx} cy="180" r="59.5" />
      ))}
    </g>
    {DOTS.map(([cx, cy, r]) => (
      <circle key={cx} cx={cx} cy={cy} r={r} fill="currentColor" />
    ))}
  </svg>
);
