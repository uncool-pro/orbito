import { useEffect, useState } from 'react';

import { findScreen } from '@uncool-pro/orbito-core';

import { Board } from '../board/Board';
import { Catalog } from '../ds/Catalog';
import { FlowsPage } from '../flows/FeatureMap';
import { SkillsMap } from '../skills/SkillsMap';
import { useT } from '../i18n';
import { useViewer } from './context';
import { canvasHash, lastCanvasHash, parseRoute, rememberCanvas } from './routes';
import { pageOfScreen, Shell } from './shell/Shell';
import { ScreenView } from './ScreenView';

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

export const App = () => {
  const { project } = useViewer();
  const t = useT();
  const hash = useHash();
  const route = parseRoute(hash);

  if (route.view === 'board') {
    const page = project.pages.find((p) => p.key === route.page) ?? project.pages[0];

    if (!page) return <div className="pd-empty">{t.noFlows}</div>;
    const flow = page.flows.find((f) => f.key === route.flow);
    const canonical = canvasHash('board', page.key, flow?.key);

    if (canonical !== hash) {
      window.location.replace(canonical);

      return null;
    }
    rememberCanvas(canonical);

    return (
      <Shell mode="board" page={page} flowKey={flow?.key}>
        <Board key={canonical} page={page} flowKey={flow?.key} />
      </Shell>
    );
  }
  if (route.view === 'flows') {
    const page = project.pages.find((p) => p.key === route.page) ?? project.pages[0];

    if (!page) return <div className="pd-empty">{t.noFlows}</div>;
    const flow = page.flows.find((f) => f.key === route.flow);

    rememberCanvas(canvasHash('flows', page.key, flow?.key));

    return (
      <Shell mode="flows" page={page} flowKey={flow?.key}>
        <FlowsPage key={`${page.key}/${flow?.key ?? ''}`} page={page} flowKey={flow?.key} />
      </Shell>
    );
  }
  if (route.view === 'ds') {
    return (
      <Shell mode="ds" dsSection={route.section}>
        <Catalog key={route.section ?? ''} section={route.section} />
      </Shell>
    );
  }
  if (route.view === 'skills') {
    return (
      <Shell mode="skills">
        <SkillsMap />
      </Shell>
    );
  }
  if (route.view === 'screen') {
    const screen = findScreen(project.screens, route.screen);

    if (screen) {
      // keep the page the person came from when the screen is on it; otherwise the first page that lists it
      const last = parseRoute(lastCanvasHash());
      const lastPage = 'page' in last ? project.pages.find((p) => p.key === last.page) : undefined;
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
          <code>{route.screen}</code>
        </p>
        <a href={lastCanvasHash()}>{t.backToBoard}</a>
      </div>
    );
  }

  // the overview lives in the left panel now: start on the board
  window.location.replace(canvasHash('board'));

  return null;
};
