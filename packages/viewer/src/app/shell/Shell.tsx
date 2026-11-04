import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { Page } from '@uncool-pro/orbito-core';

import { useT } from '../../i18n';
import { go, lastCanvasHash, parseRoute } from '../routes';
import type { Mode } from '../routes';
import { useShell } from './state';
import { isPage } from './common';
import { TopBar } from './TopBar';
import { Drawer } from './Drawer';
import { Inspector } from './Inspector';
import { Island } from './Island';
import { Welcome } from '../Welcome';
import { CommentBubble } from '../Comments';
import { Icon } from '../icons';

type ShellProps = { mode: Mode; page?: Page; flowKey?: string; dsSection?: string; children: ReactNode };

/**
 * App shell, after Figma: a thin top bar (where am I, search, health), a left panel with the hierarchy
 * (project: pages → flows → screens; design system: tokens and components), the canvas in the middle,
 * an inspector on the right (the selected screen, or view options), and an island at the bottom to switch modes and zoom.
 */
export const Shell = ({ mode, page, flowKey, dsSection, children }: ShellProps) => {
  const { drawerOpen, inspectorOpen, devMode, selected, codeWidth } = useShell();
  // in dev mode the right panel shows the selected screen's code, as wide as the person dragged it
  const width = devMode && selected && !isPage(mode) ? ({ '--pd-insp-w': `${codeWidth}px` } as CSSProperties) : undefined;

  return (
    <div className={`pd-shell${drawerOpen ? '' : ' no-drawer'}${inspectorOpen && !isPage(mode) ? '' : ' no-inspector'}`} style={width}>
      <TopBar mode={mode} page={page} flowKey={flowKey} />
      <Welcome />
      <CommentBubble />
      {drawerOpen && <Drawer mode={mode} page={page} flowKey={flowKey} dsSection={dsSection} />}
      <main className="pd-main">
        {isPage(mode) && <BackBar />}
        {children}
        {!isPage(mode) && <Island mode={mode} page={page} flowKey={flowKey} />}
      </main>
      {inspectorOpen && !isPage(mode) && <Inspector mode={mode} page={page} flowKey={flowKey} />}
    </div>
  );
};

/**
 * The skills map and the design-system catalog are places you visit from the board: a way back where people look for
 * it (top left, under the bar) and Esc, so neither is a dead end with only the breadcrumbs to leave by.
 */
const BackBar = () => {
  const t = useT();
  const back = lastCanvasHash();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
      go(lastCanvasHash());
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="pd-backbar" data-pd-ui>
      <a href={back} className="pd-backbar__link">
        <Icon name="chevron-left" size={16} />
        {parseRoute(back).view === 'flows' ? t.backToFlows : t.backToBoard}
      </a>
    </div>
  );
};

export { pageOfScreen } from './common';
