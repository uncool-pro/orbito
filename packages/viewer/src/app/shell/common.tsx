/** What the panels of the shell share: the modes that are pages, the page of a screen, the panel icons. */
import type { ComponentType } from 'react';

import type { Page, Project } from '@uncool-pro/orbito-core';

import type { Mode } from '../routes';

/** Modes that are full pages of their own: no canvas island, no screen inspector. */
export const isPage = (mode: Mode) => mode === 'ds' || mode === 'skills';

/** The page a screen belongs to: the first page with a flow (or a version) that lists it. */
export const pageOfScreen = (project: Project<ComponentType>, id: string): Page | undefined =>
  project.pages.find((p) =>
    p.flows.some((f) => f.screens.includes(id) || (f.versions ?? []).some((v) => v.screens.some((s) => s.id === id))),
  );
