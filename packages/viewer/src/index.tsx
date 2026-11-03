import { StrictMode, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import type { LinkMap, Project, ProjectProblem, Requirement, StatusFile, Team } from '@uncool-pro/orbito-core';
import { registerParents } from '@uncool-pro/orbito-runtime';

import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { setFavicon } from './app/Logo';
import { ViewerContext } from './app/context';
import { ShellProvider } from './app/shell/state';
import type { DsData } from './app/context';
import { probeLinks } from './board/probe';
import { LOCALES, MessagesContext } from './i18n';
import { initComments } from './comments';
import type { CommentsFile } from './comments';
import { initStatuses } from './status';
import './viewer.css';

export type LoadedProject = { project: Project<ComponentType>; problems: ProjectProblem[]; statuses: StatusFile; comments?: CommentsFile; dev: boolean; ds: DsData; team?: Team | null; requirements?: Requirement[] };

const Root = ({ loaded }: { loaded: LoadedProject }) => {
  const [links, setLinks] = useState<LinkMap | null>(null);
  const requirements = useMemo(() => new Map((loaded.requirements ?? []).map((r) => [r.id, r])), [loaded]);

  useEffect(() => {
    let live = true;

    probeLinks(loaded.project)
      .catch((err: unknown) => {
        // without links the board still shows every screen, only the arrows are missing
        console.error('[orbito] could not read the links of the screens', err);

        return {} as LinkMap;
      })
      .then((l) => {
        if (!live) return;
        setLinks(l);
        // read by agents (e.g. to check that every flow step is reachable)
        (window as unknown as Record<string, unknown>).__orbito = { screens: loaded.project.screens.map(({ component: _c, ...s }) => s), pages: loaded.project.pages, links: l, problems: loaded.problems };
      });

    return () => {
      live = false;
    };
  }, [loaded]);

  return (
    <ViewerContext.Provider value={{ project: loaded.project, problems: loaded.problems, ds: loaded.ds, team: loaded.team ?? null, links, requirements }}>
      <MessagesContext.Provider value={LOCALES[loaded.project.config.locale ?? 'en']}>
        <ShellProvider>
          {/* the last line of defence: a message instead of an empty page */}
          <ErrorBoundary name="Orbito">
            <App />
          </ErrorBoundary>
        </ShellProvider>
      </MessagesContext.Provider>
    </ViewerContext.Provider>
  );
};

/** Mounts the viewer (overview, board, screens) for a project loaded by `@uncool-pro/orbito-vite-plugin`. */
export const mount = (loaded: LoadedProject, container: HTMLElement | null = document.getElementById('root')) => {
  if (!container) throw new Error('orbito: no #root element');
  registerParents(loaded.project.screens);
  // tokens.json -> CSS variables, so screens and the catalog read the same values
  const style = document.getElementById('pd-tokens') ?? document.head.appendChild(Object.assign(document.createElement('style'), { id: 'pd-tokens' }));

  style.textContent = loaded.ds.css;
  // the typefaces the tokens name (design-system/fonts.css), shared with the static export
  const fonts = document.getElementById('pd-fonts') ?? document.head.appendChild(Object.assign(document.createElement('style'), { id: 'pd-fonts' }));

  fonts.textContent = loaded.ds.fonts ?? '';
  initStatuses(loaded.statuses, loaded.dev);
  initComments(loaded.comments, loaded.dev);
  setFavicon();
  loaded.problems.forEach((p) => console[p.level === 'error' ? 'error' : 'warn'](`[orbito] ${p.file ? `${p.file}: ` : ''}${p.message}`));
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <Root loaded={loaded} />
    </StrictMode>,
  );

  return root;
};

export { parseFindings } from './board/findings';
export * from './canvas/camera';
