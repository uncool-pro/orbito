import { useEffect, useState } from 'react';

import { findScreen } from '@uncool-pro/orbito-core';

import { Board } from '../board/Board';
import { Catalog } from '../ds/Catalog';
import { FlowsView } from '../flows/FlowsView';
import { useT } from '../i18n';
import { useViewer } from './context';
import { pageOfScreen, Shell } from './shell/Shell';
import { ScreenView } from './ScreenView';

const LAST_BOARD = 'pd.lastBoard';

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const on = () => setHash(window.location.hash);

    window.addEventListener('hashchange', on);
    // a redirect made during the first render (location.replace) can fire its hashchange before this listener exists
    on();

    return () => window.removeEventListener('hashchange', on);
  }, []);

  return hash;
};

export const lastBoardHash = () => {
  try {
    return sessionStorage.getItem(LAST_BOARD) ?? '#/board';
  } catch {
    return '#/board';
  }
};

/** Routes: `#/` overview, `#/board[/<page>[/<flow>]]`, `#/s/<screen id or code>`. */
export const App = () => {
  const { project } = useViewer();
  const t = useT();
  const hash = useHash();
  const [route, ...rest] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  if (route === 'board') {
    const page = project.pages.find((p) => p.key === rest[0]) ?? project.pages[0];

    if (!page) return <div className="pd-empty">{t.noFlows}</div>;
    const flow = page.flows.find((f) => f.key === rest[1]);
    const canonical = `#/board/${page.key}${flow ? `/${flow.key}` : ''}`;

    if (canonical !== hash) {
      window.location.replace(canonical);

      return null;
    }
    try {
      sessionStorage.setItem(LAST_BOARD, canonical);
    } catch {
      /* storage unavailable */
    }

    return (
      <Shell mode="board" page={page} flowKey={flow?.key}>
        <Board key={canonical} page={page} flowKey={flow?.key} />
      </Shell>
    );
  }
  if (route === 'flows') {
    const page = project.pages.find((p) => p.key === rest[0]) ?? project.pages[0];

    if (!page) return <div className="pd-empty">{t.noFlows}</div>;
    const flow = page.flows.find((f) => f.key === rest[1]);

    try {
      sessionStorage.setItem(LAST_BOARD, `#/flows/${page.key}${flow ? `/${flow.key}` : ''}`);
    } catch {
      /* storage unavailable */
    }

    return (
      <Shell mode="flows" page={page} flowKey={flow?.key}>
        <FlowsView key={`${page.key}/${flow?.key ?? ''}`} page={page} flowKey={flow?.key} />
      </Shell>
    );
  }
  if (route === 'ds') {
    const section = rest.length ? rest.join('/') : undefined;

    return (
      <Shell mode="ds" dsSection={section}>
        <Catalog key={rest.join('/')} section={section} />
      </Shell>
    );
  }
  if (route === 's' && rest[0]) {
    const screen = findScreen(project.screens, rest[0].replace(/\?.*$/, ''));

    if (screen) {
      // keep the page the person came from when the screen is on it; otherwise the first page that lists it
      const lastKey = /#\/(?:board|flows)\/([^/]+)/.exec(lastBoardHash())?.[1];
      const lastPage = project.pages.find((p) => p.key === lastKey);
      const onLast = lastPage?.flows.some((f) => f.screens.includes(screen.id));
      const page = onLast ? lastPage : pageOfScreen(project, screen.id);
      const flow = page?.flows.find((f) => f.screens.includes(screen.id));

      return (
        <Shell mode="prototype" page={page} flowKey={flow?.key}>
          <ScreenView key={screen.id} screen={screen} />
        </Shell>
      );
    }

    return (
      <div className="pd-doc">
        <h1>{t.notFound}</h1>
        <p>
          <code>{rest[0]}</code>
        </p>
        <a href={lastBoardHash()}>{t.backToBoard}</a>
      </div>
    );
  }

  // the overview lives in the left panel now: start on the board
  window.location.replace('#/board');

  return null;
};
