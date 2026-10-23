import { useEffect } from 'react';
import type { ComponentType } from 'react';

import type { Screen } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

import { ErrorBoundary } from './ErrorBoundary';
import { useViewer } from './context';
import { useShell } from './shell/state';

/** Prototype mode: one screen, clickable like the real product; its links navigate, the inspector follows. */
export const ScreenView = ({ screen }: { screen: Screen<ComponentType> }) => {
  const { project } = useViewer();
  const { select } = useShell();
  const vp = project.viewports[screen.viewport ?? project.config.defaultViewport]!;
  const S = screen.component;
  // a web page wider than the stage is shown scaled down (CSS zoom keeps scrolling and hit-testing right)
  const zoom = vp.kind === 'page' ? Math.min(1, (window.innerWidth - 640) / vp.width) : 1;

  useEffect(() => select(screen.id), [screen.id, select]);

  return (
    <div className="pd-screen-page">
      <div className={`pd-stage pd-stage--${vp.kind}`}>
        <div className="pd-stage__frame" style={{ zoom: Math.max(0.4, zoom) }}>
          <FrameContext.Provider value={{ mode: 'screen', viewport: vp }}>
            <ErrorBoundary name={screen.code ?? screen.id}>
              <S />
            </ErrorBoundary>
          </FrameContext.Provider>
        </div>
      </div>
    </div>
  );
};
