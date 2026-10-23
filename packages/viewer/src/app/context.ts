import { createContext, useContext } from 'react';

import type { ComponentType, ReactNode } from 'react';

import type { ComponentDocs, DsReport, LinkMap, Project, ProjectProblem, Team, TokenFile } from '@uncool-pro/orbito-core';

export type DsData = { tokens: TokenFile; css: string; report: DsReport; docs: ComponentDocs<ReactNode>[]; /** design-system/fonts.css, if the project has one */ fonts?: string };

export type ViewerState = {
  project: Project<ComponentType>;
  problems: ProjectProblem[];
  ds: DsData;
  /** Orbito, its agents and their skills (from .claude/); `null` when the project has none. */
  team: Team | null;
  /** Links found by the probe; `null` while it runs. */
  links: LinkMap | null;
};

export const ViewerContext = createContext<ViewerState | null>(null);

export const useViewer = (): ViewerState => {
  const v = useContext(ViewerContext);

  if (!v) throw new Error('orbito: viewer context missing');

  return v;
};
