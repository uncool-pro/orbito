import { createContext, useContext } from 'react';

import type { ComponentType, ReactNode } from 'react';

import type { ComponentDocs, DsReport, LinkMap, Project, ProjectProblem, Requirement, Screen, Team, TokenFile } from '@uncool-pro/orbito-core';

export type DsData = { tokens: TokenFile; css: string; report: DsReport; docs: ComponentDocs<ReactNode>[]; /** design-system/fonts.css, if the project has one */ fonts?: string };

export type ViewerState = {
  project: Project<ComponentType>;
  problems: ProjectProblem[];
  ds: DsData;
  /** Orbito, its agents and their skills (from .claude/); `null` when the project has none. */
  team: Team | null;
  /** Links found by the probe; `null` while it runs. */
  links: LinkMap | null;
  /** The screens that lead to each screen (the links read the other way round); empty while the probe runs. */
  sources: Map<string, string[]>;
  /** The navigation most screens repeat (a tab bar, a menu); empty while the probe runs. */
  shared: Set<string>;
  /** Every screen, by its id. */
  screens: Map<string, Screen<ComponentType>>;
  /** The name people call a screen by, or the id itself when there is no such screen. */
  nameOf: (id: string) => string;
  /** The stories in requirements/*.md, by id. */
  requirements: Map<string, Requirement>;
};

export const ViewerContext = createContext<ViewerState | null>(null);

export const useViewer = (): ViewerState => {
  const v = useContext(ViewerContext);

  if (!v) throw new Error('orbito: viewer context missing');

  return v;
};
