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

/** Signal, Wi-Fi and battery drawn as vectors in the text colour (characters render differently on every system). */
const StatusIcons = () => (
  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 3.6a9.4 9.4 0 0 1 13 0" />
      <path d="M3.3 6a6 6 0 0 1 8.4 0" />
      <path d="M5.6 8.3a2.7 2.7 0 0 1 3.8 0" />
      <circle cx="7.5" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" strokeOpacity="0.4" />
      <rect x="2" y="2" width="19" height="8" rx="1.8" fill="currentColor" />
      <rect x="23.8" y="4" width="1.7" height="4" rx="0.85" fill="currentColor" fillOpacity="0.4" />
    </svg>
  </span>
);

const StatusBar = () => (
  <div style={{ height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 0 28px', font: '600 15px/1 system-ui, sans-serif' }}>
    <span>9:41</span>
    <StatusIcons />
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
  /** Bar that stays at the top while the page scrolls (site header, navigation). */
  top?: ReactNode;
  /** Panel beside the content that stays put while the content scrolls (side navigation, filters, a drawer). */
  side?: ReactNode;
  /** Which edge `side` sits on. */
  sideAt?: 'left' | 'right';
  /** Bar that stays at the bottom (sticky actions, a cookie bar). Takes its own space: content never hides under it. */
  bottom?: ReactNode;
  /** Floating layer over the bottom of the content (chat button, toast); it does not move with the scroll. */
  overlay?: ReactNode;
  /** Layer over the whole window, bars included: a dialog with its scrim. */
  modal?: ReactNode;
  background?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * A web page seen through a browser window: exactly the viewport's size, with one scrolling content area
 * (`data-pd-scroll`), so on the board and in the prototype it behaves like the real thing. What has to stay in place
 * while the page scrolls goes into `top`, `side`, `bottom` or `overlay`, never into the scrolling content; inside the
 * content, `position: sticky` sticks to this window. The window is also a query container named `page`, so one page
 * adapts to every width it is shown at (`@container page (max-width: 600px)`).
 * In a static export it is a real page instead: the browser scrolls, the bars are sticky.
 */
export const PageScreen = ({ top, side, sideAt = 'left', bottom, overlay, modal, background, className, children }: PageScreenProps) => {
  const { mode, viewport } = useFrame();
  const exported = mode === 'export';
  const container: CSSProperties = { containerType: 'inline-size', containerName: 'page' };

  if (exported) {
    const sidePanel = side && <div style={{ flex: 'none', position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto' }}>{side}</div>;

    return (
      <div className={className} data-pd-frame="page" style={{ ...container, position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background }}>
        {top && <div style={{ position: 'sticky', top: 0, zIndex: 3 }}>{top}</div>}
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: sideAt === 'left' ? 'row' : 'row-reverse' }}>
          {sidePanel}
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>{children}</div>
        </div>
        {bottom && <div style={{ position: 'sticky', bottom: 0, zIndex: 3 }}>{bottom}</div>}
        {overlay && <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 4 }}>{overlay}</div>}
        {modal && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>{modal}</div>}
      </div>
    );
  }

  // layout containment (from the query container) makes the window the containing block of `position: fixed` too
  return (
    <div
      className={className}
      data-pd-frame="page"
      style={{ ...container, position: 'relative', width: viewport.width, height: viewport.height, display: 'flex', flexDirection: 'column', overflow: 'hidden', background }}
    >
      {top && <div style={{ flex: 'none', position: 'relative', zIndex: 3 }}>{top}</div>}
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: sideAt === 'left' ? 'row' : 'row-reverse' }}>
        {side && <div style={{ flex: 'none', minHeight: 0, overflowY: 'auto', position: 'relative', zIndex: 2 }}>{side}</div>}
        <div style={{ flex: '1 1 auto', minWidth: 0, position: 'relative' }}>
          <div data-pd-scroll style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>
          {overlay && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4 }}>{overlay}</div>}
        </div>
      </div>
      {bottom && <div style={{ flex: 'none', position: 'relative', zIndex: 3 }}>{bottom}</div>}
      {modal && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>{modal}</div>}
    </div>
  );
};
