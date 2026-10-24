import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { useFrame } from './context';

type DeviceScreenProps = {
  /** Fixed area above the scrolling content (app bar, tabs). */
  top?: ReactNode;
  /** Fixed area below it (tab bar, bottom actions). Takes its own space: content never hides under it. */
  bottom?: ReactNode;
  /** Floating layer over the bottom of the content (floating button, toast). The content gets extra end padding for it. */
  overlay?: ReactNode;
  /** Layer over the whole screen, bars included: a bottom sheet or a dialog with its scrim. */
  modal?: ReactNode;
  /** Device status bar (time, battery); `false` hides it, a node replaces it. */
  statusBar?: boolean | ReactNode;
  background?: string;
  className?: string;
  children?: ReactNode;
};

const StatusBar = () => (
  <div style={{ height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', font: '600 15px/1 system-ui, sans-serif' }}>
    <span>9:41</span>
    <span aria-hidden="true" style={{ letterSpacing: 2 }}>
      ▂▄▆ ▮
    </span>
  </div>
);

/**
 * A phone or tablet screen: always exactly the viewport's size, with fixed `top` / `bottom` areas and one scrolling
 * content area in between (`data-pd-scroll`). The same layout everywhere, so a screen looks the same on the board
 * and on its own page, and the board knows what to scroll.
 */
export const DeviceScreen = ({ top, bottom, overlay, modal, statusBar = true, background, className, children }: DeviceScreenProps) => {
  const { viewport } = useFrame();
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // the floating layer's height becomes end padding of the content, so the last item can always scroll above it
  useLayoutEffect(() => {
    const o = overlayRef.current;
    const s = scrollRef.current;

    if (!o || !s) return;
    const sync = () => s.style.setProperty('--pd-overlay-h', `${o.offsetHeight}px`);

    sync();
    const ro = new ResizeObserver(sync);

    ro.observe(o);

    return () => ro.disconnect();
  }, [overlay]);

  const root: CSSProperties = { position: 'relative', width: viewport.width, height: viewport.height, display: 'flex', flexDirection: 'column', overflow: 'hidden', background };

  return (
    <div className={className} style={root} data-pd-frame="device">
      {statusBar === true ? <StatusBar /> : statusBar || null}
      {top && <div style={{ flex: 'none', position: 'relative', zIndex: 1 }}>{top}</div>}
      <div style={{ flex: '1 1 auto', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div ref={scrollRef} data-pd-scroll style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 'var(--pd-overlay-h, 0px)', scrollbarWidth: 'none' }}>
          {children}
        </div>
        {overlay && (
          <div ref={overlayRef} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2 }}>
            {overlay}
          </div>
        )}
      </div>
      {bottom && <div style={{ flex: 'none', position: 'relative', zIndex: 1 }}>{bottom}</div>}
      {modal && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>{modal}</div>}
    </div>
  );
};

type PageScreenProps = {
  background?: string;
  className?: string;
  /** Layer over the first screenful of the page: a dialog with its scrim. */
  modal?: ReactNode;
  children?: ReactNode;
};

/**
 * A web page: as wide as the viewport, at least as tall, and the whole page scrolls (on the board: inside the card).
 * In a static export it spans the browser window instead.
 */
export const PageScreen = ({ background, className, modal, children }: PageScreenProps) => {
  const { mode, viewport } = useFrame();
  const exported = mode === 'export';

  return (
    // a query container, so one page adapts to every width it is shown at (`@container page (max-width: 600px)`)
    <div
      className={className}
      data-pd-frame="page"
      style={{ position: 'relative', width: exported ? '100%' : viewport.width, minHeight: exported ? '100vh' : viewport.height, background, containerType: 'inline-size', containerName: 'page' }}
    >
      {children}
      {modal && <div style={{ position: 'absolute', left: 0, top: 0, width: viewport.width, height: viewport.height, zIndex: 10 }}>{modal}</div>}
    </div>
  );
};
