/**
 * `orbito export` — one screen of the project as a static site: `index.html` with the page's markup, the tokens and the
 * fonts inlined, plus the project's `public/` folder. No scripts: links are plain hrefs (`#section` or another site),
 * disclosures are native `<details>`. Meant for pages that are both the mockup and the product, such as a landing page.
 *
 * The screen is rendered with the project's own Vite config (SSR), so it resolves exactly as in the viewer.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

import { tokensToCss } from '@uncool-pro/orbito-core';
import type { ProjectConfig, TokenFile } from '@uncool-pro/orbito-core';

const ENTRY = 'virtual:orbito/export-entry';
const RESOLVED_ENTRY = '\0' + ENTRY;

// renders inside the project's module graph, so React and the runtime are the project's own instances
const ENTRY_SOURCE = `
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FrameContext } from '@uncool-pro/orbito-runtime';
export const render = (Screen, viewport) =>
  renderToStaticMarkup(createElement(FrameContext.Provider, { value: { mode: 'export', viewport } }, createElement(Screen)));
`;

// what a browser needs around the page; everything visual comes from the design system
const BASE_CSS = `*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--color-bg, #fff); color: var(--color-ink, #111); font: var(--text-body, 16px/1.5 system-ui, sans-serif); }
img, video, svg { max-width: 100%; height: auto; }
a { color: inherit; }
summary { list-style: none; }
summary::-webkit-details-marker { display: none; }
`;

export type ExportOptions = { root: string; screen?: string; out?: string };
export type ExportResult = { screen: string; file: string; out: string; bytes: number; copied: number };

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inside = (dir: string, file: string) => {
  const rel = relative(dir, file);

  return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
};

/** Finds `screens/**\/<id>.screen.tsx`, the file convention of a screen id. */
const findScreenFile = (root: string, id: string): string | undefined => {
  const walk = (dir: string): string | undefined => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);

      if (statSync(full).isDirectory()) {
        const found = walk(full);

        if (found) return found;
      } else if (name === `${id}.screen.tsx` || name === `${id}.screen.jsx`) return full;
    }

    return undefined;
  };
  const screens = join(root, 'screens');

  return existsSync(screens) ? walk(screens) : undefined;
};

export const exportSite = async ({ root, screen, out }: ExportOptions): Promise<ExportResult> => {
  const vite = await import('vite');
  const server = await vite.createServer({
    root,
    configFile: ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'].map((f) => join(root, f)).find(existsSync) ?? false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [{ name: 'orbito-export-entry', resolveId: (id: string) => (id === ENTRY ? RESOLVED_ENTRY : undefined), load: (id: string) => (id === RESOLVED_ENTRY ? ENTRY_SOURCE : undefined) }],
  });

  try {
    const configFile = join(root, 'orbito.config.ts');
    const config: ProjectConfig = existsSync(configFile) ? ((await server.ssrLoadModule('/orbito.config.ts')).default as ProjectConfig) : { title: 'Site' };
    const id = screen ?? config.site?.screen;

    if (!id) throw new Error('no screen to export: pass its id (`orbito export <screen-id>`) or set `site.screen` in orbito.config.ts');
    const file = findScreenFile(root, id);

    if (!file) throw new Error(`screen "${id}" not found (expected screens/**/${id}.screen.tsx)`);
    const mod = await server.ssrLoadModule('/' + relative(root, file).split('\\').join('/'));

    if (typeof mod.default !== 'function') throw new Error(`${relative(root, file)} has no default export (the screen component)`);
    const { render } = await server.ssrLoadModule(ENTRY);
    // width is the page's own in an export (PageScreen spans the window); the height is only a minimum
    const markup = (render(mod.default, { key: 'export', width: 1440, height: 900, kind: 'page' }) as string).replace(/\sdata-pd-[a-z-]+="[^"]*"/g, '');

    const tokens = JSON.parse(readFileSync(join(root, 'design-system/tokens.json'), 'utf8')) as TokenFile;
    const fontsFile = join(root, 'design-system/fonts.css');
    const fonts = existsSync(fontsFile) ? readFileSync(fontsFile, 'utf8') : '';
    const site = config.site?.screen === id ? config.site : undefined;
    const title = site?.title ?? (mod.meta?.title as string | undefined) ?? config.title;
    const lang = site?.lang ?? config.locale ?? 'en';
    const html = [
      '<!doctype html>',
      `<html lang="${escapeHtml(lang)}">`,
      '<head>',
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<title>${escapeHtml(title)}</title>`,
      site?.description ? `<meta name="description" content="${escapeHtml(site.description)}" />` : '',
      fonts.trim() ? `<style>\n${fonts.trim()}\n</style>` : '',
      `<style>\n${tokensToCss(tokens)}${BASE_CSS}</style>`,
      '</head>',
      '<body>',
      markup,
      '</body>',
      '</html>',
      '',
    ]
      .filter(Boolean)
      .join('\n');

    const target = resolve(root, out ?? site?.out ?? 'site');

    if (!inside(root, target)) throw new Error(`output folder must be inside the project: ${target}`);
    // the folder belongs to the export: start clean so removed files do not linger
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    let copied = 0;
    const pub = join(root, 'public');

    if (existsSync(pub)) {
      cpSync(pub, target, { recursive: true, filter: (src) => (statSync(src).isFile() ? ++copied > 0 : true) });
    }
    const index = join(target, 'index.html');

    writeFileSync(index, html);

    return { screen: id, file: relative(root, file), out: relative(root, target) || '.', bytes: Buffer.byteLength(html), copied };
  } finally {
    await server.close();
  }
};
