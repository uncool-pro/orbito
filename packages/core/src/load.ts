import { BUILT_IN_VIEWPORTS } from './model.ts';
import type { Page, Project, ProjectConfig, Screen, ScreenMeta, Viewport } from './model.ts';

/** A module found by the file convention: `screens/**\/<id>.screen.tsx` exporting `default` (component) and `meta`. */
export type ScreenModule<C> = { default?: C; meta?: ScreenMeta; loadError?: string };
export type PageModule = { default?: Page; loadError?: string };

export type ProjectProblem = { level: 'error' | 'warning'; message: string; file?: string };

const SCREEN_FILE = /([^/\\]+)\.screen\.[jt]sx?$/;

/** Screen id from its file path: `screens/plants/plant-list.screen.tsx` -> `plant-list`. */
export const screenIdOf = (file: string): string | undefined => SCREEN_FILE.exec(file)?.[1];

/**
 * Builds the project from the config and the modules collected by the file convention, and reports what is wrong
 * (duplicate ids or codes, flows pointing at missing screens, unknown viewports). Never throws: a broken file must not
 * take the whole board down, it shows up as a problem instead.
 */
export const loadProject = <C>(
  config: ProjectConfig,
  screenModules: Record<string, ScreenModule<C>>,
  pageModules: Record<string, PageModule>,
): { project: Project<C>; problems: ProjectProblem[] } => {
  const problems: ProjectProblem[] = [];
  const viewports: Record<string, Viewport> = { ...BUILT_IN_VIEWPORTS, ...config.viewports };
  const wantedDefault = config.defaultViewport ?? 'mobile';
  const defaultViewport = viewports[wantedDefault] ? wantedDefault : 'mobile';
  const locale = config.locale ?? 'en';

  if (!viewports[wantedDefault])
    problems.push({ level: 'error', message: `defaultViewport "${wantedDefault}" is not a known viewport` });
  // a language tag: two or three letters, optionally a region (pt-BR)
  const knownForm = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(locale);

  if (!knownForm) problems.push({ level: 'error', message: `locale "${locale}" is not a language tag, using en` });

  const screens: Screen<C>[] = [];
  const seenCodes = new Map<string, string>();

  Object.entries(screenModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([file, mod]) => {
      const id = screenIdOf(file);
      const rel = file.replace(/^\/+/, '');

      if (!id) return;
      if (mod.loadError)
        return void problems.push({
          level: 'error',
          file: rel,
          message: `screen file cannot be loaded: ${mod.loadError}`,
        });
      if (!mod.default)
        return void problems.push({
          level: 'error',
          file: rel,
          message: 'screen file has no default export (the screen component)',
        });
      if (!mod.meta)
        return void problems.push({
          level: 'error',
          file: rel,
          message: 'screen file has no `meta` export (defineScreen({...}))',
        });
      if (screens.some((s) => s.id === id))
        return void problems.push({
          level: 'error',
          file: rel,
          message: `duplicate screen id "${id}" (file names must be unique)`,
        });
      const wanted = mod.meta.viewport ?? mod.meta.viewports?.[0] ?? defaultViewport;
      const sizes = mod.meta.viewports?.filter((v) => viewports[v]);
      const viewport = viewports[wanted] ? wanted : (sizes?.[0] ?? defaultViewport);

      [wanted, ...(mod.meta.viewports ?? [])].forEach((v, i, all) => {
        if (all.indexOf(v) === i && !viewports[v])
          problems.push({ level: 'error', file: rel, message: `unknown viewport "${v}"` });
      });
      if (mod.meta.code) {
        const other = seenCodes.get(mod.meta.code.toLowerCase());

        if (other)
          problems.push({ level: 'error', file: rel, message: `code ${mod.meta.code} is already used by "${other}"` });
        seenCodes.set(mod.meta.code.toLowerCase(), id);
      }
      screens.push({
        ...mod.meta,
        ...(sizes ? { viewports: sizes } : {}),
        viewport,
        id,
        file: rel,
        component: mod.default,
      });
    });

  const ids = new Set(screens.map((s) => s.id));
  const pages: Page[] = Object.entries(pageModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([file, mod]) => {
      if (mod.loadError) {
        problems.push({ level: 'error', file, message: `flow file cannot be loaded: ${mod.loadError}` });

        return [];
      }
      if (!mod.default) {
        problems.push({ level: 'error', file, message: 'flow file has no default export (definePage({...}))' });

        return [];
      }

      const page = mod.default;

      if (!Array.isArray(page.flows))
        problems.push({ level: 'error', file, message: `page "${page.key}" has no list of flows` });
      const flows = (Array.isArray(page.flows) ? page.flows : []).map((flow) => {
        if (!Array.isArray(flow.screens))
          problems.push({ level: 'error', file, message: `flow ${page.key}/${flow.key} has no list of screens` });

        return { ...flow, screens: Array.isArray(flow.screens) ? flow.screens : [] };
      });

      return [{ ...page, flows }];
    });

  pages.forEach((page) =>
    page.flows.forEach((flow) => {
      const where = `${page.key}/${flow.key}`;

      flow.screens
        .filter((id) => !ids.has(id))
        .forEach((id) => problems.push({ level: 'warning', message: `flow ${where} lists a missing screen "${id}"` }));
      (flow.versions ?? []).forEach((v) =>
        (v.screens ?? []).forEach((vs) => {
          if (!ids.has(vs.id))
            problems.push({ level: 'warning', message: `version ${where}/${v.key} lists a missing screen "${vs.id}"` });
          if (vs.replaces && !flow.screens.includes(vs.replaces))
            problems.push({
              level: 'warning',
              message: `version ${where}/${v.key}: "${vs.replaces}" is not in the flow`,
            });
        }),
      );
    }),
  );
  screens
    .filter((s) => s.back && !ids.has(s.back))
    .forEach((s) =>
      problems.push({ level: 'warning', file: s.file, message: `back points to a missing screen "${s.back}"` }),
    );

  return {
    project: { config: { ...config, locale: knownForm ? locale : 'en', defaultViewport }, viewports, screens, pages },
    problems,
  };
};

/** Finds a screen by id or code, case-insensitive (codes are what people type and say). */
export const findScreen = <C>(screens: Screen<C>[], key: string): Screen<C> | undefined => {
  const k = key.toLowerCase();

  return screens.find((s) => s.id.toLowerCase() === k) ?? screens.find((s) => s.code?.toLowerCase() === k);
};
