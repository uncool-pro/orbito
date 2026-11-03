// Vite plugin of Orbito.
//
// 1. `virtual:orbito/project` — the project, assembled from the file convention (no hand-kept registry):
//      orbito.config.ts                      project settings
//      screens/**/<id>.screen.tsx        default export = screen component, `meta` = defineScreen({...})
//      flows/**/*.flow.ts                default export = definePage({...})
//      .orbito/status.json                   screen statuses (inlined into the build, read-only there)
//      design-system/tokens.json         tokens -> CSS variables (injected by the viewer)
//      design-system/fonts.css           optional: @font-face / @import of the typefaces the tokens name (injected too)
//      design-system/**/*.docs.tsx       component docs and variants for the catalog
//      .claude/skills, .claude/agents    the team (Orbito → agents → skills) for the skills map; in the tool repo: skills/, agents/
//    plus the design-system report (`orbito check ds`), recomputed when design-system/ or screens/ change.
// 2. Dev endpoints: endpoints.mjs. The team: team.mjs. The status file: status.mjs.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchForWorkspaceRoot } from 'vite';

import { analyzeProject } from '@uncool-pro/orbito-cli/analyze';
import { parseRequirements, tokensToCss } from '@uncool-pro/orbito-core';

import { devEndpoints } from './endpoints.mjs';
import { inside, readJson } from './files.mjs';
import { readTeam, teamDirs } from './team.mjs';

const VIRTUAL = 'virtual:orbito/project';
const RESOLVED = '\0' + VIRTUAL;
const STATUS_FILE = '.orbito/status.json';
const COMMENTS_FILE = '.orbito/comments.json';
const FONTS_FILE = 'design-system/fonts.css';
/** The stories in `requirements/**\/*.md` (the local mirror of the tracker), for the screen details. */
const readRequirements = (root) => {
  const dir = resolve(root, 'requirements');

  if (!existsSync(dir)) return [];

  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.md'))
    .sort()
    .flatMap((f) => parseRequirements(`requirements/${f.split(sep).join('/')}`, readFileSync(resolve(dir, f), 'utf8')));
};
// the tool's packages: linked from outside the project (file: dependencies), the dev server must be allowed to serve them
const PACKAGES_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {{ config?: string }} [options] config: project config file relative to the Vite root (default `orbito.config.ts`)
 * @returns {import('vite').Plugin}
 */
export default function orbito(options = {}) {
  let root = process.cwd();
  let dev = false;

  return {
    name: 'orbito',
    configResolved(c) {
      root = c.root;
      dev = c.command === 'serve';
    },
    config(userConfig) {
      const projectRoot = resolve(userConfig.root ?? process.cwd());

      return {
        // one React for the project and the linked tool packages
        resolve: { dedupe: ['react', 'react-dom'] },
        server: { fs: { allow: [searchForWorkspaceRoot(projectRoot), PACKAGES_ROOT] } },
      };
    },
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return undefined;
      const configPath = '/' + (options.config ?? 'orbito.config.ts').replace(/^\/+/, '');
      const statusPath = resolve(root, STATUS_FILE);

      const tokensPath = resolve(root, 'design-system/tokens.json');
      const fontsPath = resolve(root, FONTS_FILE);

      const commentsPath = resolve(root, COMMENTS_FILE);

      this.addWatchFile(statusPath);
      if (existsSync(commentsPath)) this.addWatchFile(commentsPath);
      this.addWatchFile(tokensPath);
      // watching a missing file makes Vite resolve it as an import; a new fonts.css is picked up in configureServer
      if (existsSync(fontsPath)) this.addWatchFile(fontsPath);
      let report;

      try {
        report = analyzeProject({ root });
      } catch (e) {
        this.warn(`design-system check failed: ${String(e)}`);
        report = { tokens: readJson(tokensPath, {}), components: [], screens: {}, issues: [], counts: { error: 0, warning: 0, info: 0 } };
      }

      return [
        `import config from ${JSON.stringify(configPath)};`,
        `import { loadProject } from '@uncool-pro/orbito-core';`,
        // loaded one by one: a file that throws while loading becomes a problem on the board, not an empty page
        `const settle = async (files) => Object.fromEntries(await Promise.all(Object.entries(files).map(([file, load]) => load().then((m) => [file, m], (e) => [file, { loadError: String(e) }]))));`,
        `const screens = await settle(import.meta.glob('/screens/**/*.screen.{tsx,jsx}'));`,
        `const pages = await settle(import.meta.glob('/flows/**/*.flow.{ts,tsx,js}'));`,
        `const docs = Object.values(await settle(import.meta.glob('/design-system/**/*.docs.{tsx,jsx}'))).map((m) => m.default).filter(Boolean);`,
        `const { project, problems } = loadProject(config, screens, pages);`,
        `const ds = { tokens: ${JSON.stringify(report.tokens)}, css: ${JSON.stringify(tokensToCss(report.tokens))}, report: ${JSON.stringify(report)}, fonts: ${JSON.stringify(existsSync(fontsPath) ? readFileSync(fontsPath, 'utf8') : '')}, docs };`,
        `const team = ${JSON.stringify(readTeam(root))};`,
        `const requirements = ${JSON.stringify(readRequirements(root))};`,
        `export default { project, problems, statuses: ${JSON.stringify(readJson(statusPath, {}))}, comments: ${JSON.stringify(readJson(commentsPath, {}))}, dev: ${dev}, ds, team, requirements };`,
      ].join('\n');
    },
    configureServer(server) {
      // skills and agents (the skills map) may live outside the Vite root (the tool repository): watch them, and on any
      // change rebuild the project module and reload
      const team = teamDirs(root);

      if (team) {
        server.watcher.add([team.skills, team.agents]);
        server.watcher.on('all', (_event, file) => {
          const f = resolve(file);

          if (!inside(team.skills, f) && !inside(team.agents, f)) return;
          const mod = server.moduleGraph.getModuleById(RESOLVED);

          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        });
      }
      // a fonts.css or a settings file created while the server runs: rebuild the project module and reload
      server.watcher.on('add', (file) => {
        if (resolve(file) !== resolve(root, FONTS_FILE) && resolve(file) !== resolve(root, '.orbito/settings.json') && resolve(file) !== resolve(root, '.orbito/settings.local.json')) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);

        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
      // the comments file may appear after the start (the first comment, or Claude): push it like any later change
      server.watcher.add(resolve(root, COMMENTS_FILE));
      server.watcher.on('add', (file) => {
        if (resolve(file) === resolve(root, COMMENTS_FILE)) server.ws.send({ type: 'custom', event: 'orbito:comments', data: readJson(file, {}) });
      });
      server.middlewares.use(devEndpoints(root, resolve(root, STATUS_FILE), resolve(root, COMMENTS_FILE)));
    },
    handleHotUpdate(ctx) {
      const file = resolve(ctx.file);
      const rel = relative(root, file).split(sep).join('/');

      // a status write must not reload the page: the viewer already shows the new value
      // a status change, from the board or from Claude editing the file: send the file to the browser, no reload
      if (file === resolve(root, STATUS_FILE)) {
        ctx.server.ws.send({ type: 'custom', event: 'orbito:status', data: readJson(file, {}) });

        return [];
      }
      // comments, the same way: added on the board or written by Claude
      if (file === resolve(root, COMMENTS_FILE)) {
        ctx.server.ws.send({ type: 'custom', event: 'orbito:comments', data: readJson(file, {}) });

        return [];
      }
      // the model mode shows in the top bar and on the skills map
      if (rel === '.orbito/settings.json' || rel === '.orbito/settings.local.json' || rel === '.orbito/models.json') {
        const mod = ctx.server.moduleGraph.getModuleById(RESOLVED);

        if (mod) ctx.server.moduleGraph.invalidateModule(mod);
        ctx.server.ws.send({ type: 'full-reload' });

        return [];
      }
      // requirements are only text for the screen details: rebuild the project module and reload
      if (/^requirements\/.*\.md$/.test(rel)) {
        const mod = ctx.server.moduleGraph.getModuleById(RESOLVED);

        if (mod) ctx.server.moduleGraph.invalidateModule(mod);
        ctx.server.ws.send({ type: 'full-reload' });

        return [];
      }
      if (!/^(design-system|screens|flows)\//.test(rel)) return undefined;
      // the project module carries the tokens and the design-system report: rebuild it
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED);

      if (mod) ctx.server.moduleGraph.invalidateModule(mod);
      if (rel === 'design-system/tokens.json' || rel === FONTS_FILE) {
        ctx.server.ws.send({ type: 'full-reload' });

        return [];
      }

      return undefined;
    },
  };
}
