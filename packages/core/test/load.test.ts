import { describe, expect, it } from 'vitest';

import { loadProject } from '../src/load';
import type { Page } from '../src/model';

const Screen = () => null;
const screen = (meta: object) => ({ default: Screen, meta: { title: 'A screen', ...meta } });

describe('loadProject never lets a broken file take the board down', () => {
  it('shows a screen with an unknown viewport at the default size and reports it', () => {
    const { project, problems } = loadProject(
      { title: 'T', defaultViewport: 'desktop' },
      { '/screens/a.screen.tsx': screen({ viewport: 'watch' }) },
      {},
    );

    expect(project.screens[0]!.viewport).toBe('desktop');
    expect(problems.map((p) => p.message)).toContain('unknown viewport "watch"');
  });

  it('drops the unknown sizes of a responsive page and keeps the known ones', () => {
    const { project } = loadProject(
      { title: 'T' },
      { '/screens/a.screen.tsx': screen({ viewports: ['desktop', 'watch'] }) },
      {},
    );

    expect(project.screens[0]!.viewports).toEqual(['desktop']);
    expect(project.screens[0]!.viewport).toBe('desktop');
  });

  it('falls back to a real viewport when the default one is unknown', () => {
    const { project, problems } = loadProject(
      { title: 'T', defaultViewport: 'watch' },
      { '/screens/a.screen.tsx': screen({}) },
      {},
    );

    expect(project.viewports[project.config.defaultViewport]).toBeDefined();
    expect(project.viewports[project.screens[0]!.viewport!]).toBeDefined();
    expect(problems.map((p) => p.message)).toContain('defaultViewport "watch" is not a known viewport');
  });

  it('reports a page without flows and a flow without screens instead of throwing', () => {
    const noFlows = { key: 'a', name: 'A' } as unknown as Page;
    const noScreens = { key: 'b', name: 'B', flows: [{ key: 'f', name: 'F' }] } as unknown as Page;
    const { project, problems } = loadProject(
      { title: 'T' },
      {},
      { '/flows/a.flow.ts': { default: noFlows }, '/flows/b.flow.ts': { default: noScreens } },
    );

    expect(project.pages.map((p) => p.flows.map((f) => f.screens))).toEqual([[], [[]]]);
    expect(problems.map((p) => p.message)).toEqual(
      expect.arrayContaining(['page "a" has no list of flows', 'flow b/f has no list of screens']),
    );
  });

  it('reports a file that could not be loaded and keeps the rest', () => {
    const { project, problems } = loadProject(
      { title: 'T' },
      { '/screens/a.screen.tsx': screen({}), '/screens/b.screen.tsx': { loadError: 'Error: boom' } },
      { '/flows/c.flow.ts': { loadError: 'Error: bang' } },
    );

    expect(project.screens.map((s) => s.id)).toEqual(['a']);
    expect(problems.map((p) => p.message)).toEqual([
      'screen file cannot be loaded: Error: boom',
      'flow file cannot be loaded: Error: bang',
    ]);
  });

  it('takes any language of the product, and English for something that is not a language tag', () => {
    expect(loadProject({ title: 'T', locale: 'de' }, {}, {}).project.config.locale).toBe('de');
    const { project, problems } = loadProject({ title: 'T', locale: 'Polish!' }, {}, {});

    expect(project.config.locale).toBe('en');
    expect(problems.map((p) => p.message)).toContain('locale "Polish!" is not a language tag, using en');
  });
});
