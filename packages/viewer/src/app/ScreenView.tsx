import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import type { Screen, Viewport } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

import { useT } from '../i18n';
import { ErrorBoundary } from './ErrorBoundary';
import { useViewer } from './context';
import { useShell } from './shell/state';

// room the side panels and the stage padding take from the window
const CHROME = 640;
const SIZE_KEY = 'pd.viewport';

const useWindowWidth = () => {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const on = () => setW(window.innerWidth);

    window.addEventListener('resize', on);

    return () => window.removeEventListener('resize', on);
  }, []);

  return w;
};

const readSize = () => {
  try {
    return localStorage.getItem(SIZE_KEY);
  } catch {
    return null;
  }
};

const Frame = ({ screen, vp, zoom }: { screen: Screen<ComponentType>; vp: Viewport; zoom: number }) => {
  const S = screen.component;

  return (
    <div className="pd-stage__frame" style={{ zoom }}>
      <FrameContext.Provider value={{ mode: 'screen', viewport: vp }}>
        <ErrorBoundary name={screen.code ?? screen.id}>
          <S />
        </ErrorBoundary>
      </FrameContext.Provider>
    </div>
  );
};

// a monitor, a tablet or a phone, by the size's width
const SizeIcon = ({ width }: { width: number }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    {width >= 1024 ? (
      <>
        <rect x="1.5" y="2.5" width="13" height="8.5" rx="1" />
        <path d="M6 14h4M8 11v3" />
      </>
    ) : width >= 600 ? (
      <>
        <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" />
        <path d="M7 12.5h2" />
      </>
    ) : (
      <>
        <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
        <path d="M7.25 12.5h1.5" />
      </>
    )}
  </svg>
);

/**
 * Prototype mode: one screen, clickable like the real product; its links navigate, the inspector follows.
 * A responsive page (`viewports` in its meta) is shown at one size at a time, as big as the stage allows; the switch in
 * the top right corner changes the size, and the choice stays while you click through the prototype.
 */
export const ScreenView = ({ screen }: { screen: Screen<ComponentType> }) => {
  const { project } = useViewer();
  const { select } = useShell();
  const t = useT();
  const width = useWindowWidth();
  const [size, setSize] = useState(readSize);
  const sizes = (screen.viewports?.length ? screen.viewports : [screen.viewport ?? project.config.defaultViewport]).map((k) => project.viewports[k]!).filter(Boolean);
  const vp = sizes.find((v) => v.key === size) ?? sizes[0]!;

  useEffect(() => select(screen.id), [screen.id, select]);

  const pick = (key: string) => {
    setSize(key);
    try {
      localStorage.setItem(SIZE_KEY, key);
    } catch {
      /* private mode: the choice lasts until reload */
    }
  };

  // a web page wider than the stage is shown scaled down (CSS zoom keeps scrolling and hit-testing right)
  const zoom = vp.kind === 'page' ? Math.min(1, (width - CHROME) / vp.width) : 1;

  return (
    <div className="pd-screen-page">
      {sizes.length > 1 && (
        <div className="pd-sizebar">
          <div className="pd-sizes" role="group" aria-label={t.responsive}>
            {sizes.map((v) => (
              <button key={v.key} type="button" aria-pressed={v.key === vp.key} title={`${v.label} · ${v.width}px`} onClick={() => pick(v.key)}>
                <SizeIcon width={v.width} />
                {v.label.replace(/ web$/i, '')}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`pd-stage pd-stage--${vp.kind}`}>
        <Frame key={vp.key} screen={screen} vp={vp} zoom={Math.max(0.4, zoom)} />
      </div>
    </div>
  );
};
