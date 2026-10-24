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
const GAP = 40;

const useWindowWidth = () => {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const on = () => setW(window.innerWidth);

    window.addEventListener('resize', on);

    return () => window.removeEventListener('resize', on);
  }, []);

  return w;
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

/**
 * Prototype mode: one screen, clickable like the real product; its links navigate, the inspector follows.
 * A responsive page (`viewports` in its meta) is shown at all its sizes side by side, at one scale, so their real
 * proportions compare at a glance — the same implementation, not three designs.
 */
export const ScreenView = ({ screen }: { screen: Screen<ComponentType> }) => {
  const { project } = useViewer();
  const { select } = useShell();
  const t = useT();
  const width = useWindowWidth();
  const sizes = (screen.viewports?.length ? screen.viewports : [screen.viewport ?? project.config.defaultViewport]).map((k) => project.viewports[k]!).filter(Boolean);
  const vp = sizes[0]!;

  useEffect(() => select(screen.id), [screen.id, select]);

  if (sizes.length > 1) {
    // the gaps between frames are not scaled, only the frames
    const zoom = Math.max(0.2, Math.min(1, (width - CHROME - GAP * (sizes.length - 1)) / sizes.reduce((sum, v) => sum + v.width, 0)));

    return (
      <div className="pd-screen-page">
        <div className="pd-stage pd-stage--responsive" aria-label={t.responsive}>
          {sizes.map((v) => (
            <figure key={v.key} className="pd-stage__size">
              <figcaption>
                {v.label} <small>{v.width}px</small>
              </figcaption>
              <Frame screen={screen} vp={v} zoom={zoom} />
            </figure>
          ))}
        </div>
      </div>
    );
  }

  // a web page wider than the stage is shown scaled down (CSS zoom keeps scrolling and hit-testing right)
  const zoom = vp.kind === 'page' ? Math.min(1, (width - CHROME) / vp.width) : 1;

  return (
    <div className="pd-screen-page">
      <div className={`pd-stage pd-stage--${vp.kind}`}>
        <Frame screen={screen} vp={vp} zoom={Math.max(0.4, zoom)} />
      </div>
    </div>
  );
};
