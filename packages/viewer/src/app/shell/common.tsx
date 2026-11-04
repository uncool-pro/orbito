/** What the panels of the shell share: the modes that are pages, the page of a screen, the panel icons. */
import type { ComponentType } from 'react';

import type { Page, Project } from '@uncool-pro/orbito-core';

import type { Mode } from '../routes';

/** Modes that are full pages of their own: no canvas island, no screen inspector. */
export const isPage = (mode: Mode) => mode === 'ds' || mode === 'skills';

/** The page a screen belongs to: the first page with a flow (or a version) that lists it. */
export const pageOfScreen = (project: Project<ComponentType>, id: string): Page | undefined =>
  project.pages.find((p) => p.flows.some((f) => f.screens.includes(id) || (f.versions ?? []).some((v) => v.screens.some((s) => s.id === id))));

export const Glyph = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
export const PANEL_LEFT = 'M4 5h16v14H4zM9 5v14';
export const PANEL_RIGHT = 'M4 5h16v14H4zM15 5v14';
