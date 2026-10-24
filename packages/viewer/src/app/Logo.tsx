// Orbito's sign: the "o" of the wordmark, a ring opened where a moon sits in its orbit (source: /assets/orbito-mark.svg)
const VIEW_BOX = '36 106 148 148';
const RING = 'M167.5 164.6 A59.5 59.5 0 1 1 124.4 122.3';

export const OrbitoMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox={VIEW_BOX} aria-hidden="true">
    <path d={RING} fill="none" stroke="currentColor" strokeWidth="21" />
    <circle cx="158.4" cy="131.6" r="21" fill="currentColor" />
  </svg>
);

/** The sign as the browser tab's icon, unless the project's own `index.html` already sets one. */
export const setFavicon = () => {
  if (typeof document === 'undefined' || document.querySelector('link[rel~="icon"]')) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}"><path d="${RING}" fill="none" stroke="#111" stroke-width="21"/><circle cx="158.4" cy="131.6" r="21" fill="#111"/></svg>`;
  const link = document.createElement('link');

  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.appendChild(link);
};
