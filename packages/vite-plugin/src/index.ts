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
//      requirements/**/*.md              the stories, shown next to the screens that implement them
//      comments/<screen-id>/*.md         comments on screens
//      .claude/skills, .claude/agents    the team (Orbito → agents → skills) for the skills map; in the tool repo: skills/, agents/
//    plus the design-system report (`orbito check ds`), recomputed when design-system/ or screens/ change.
// 2. Dev endpoints: endpoints.ts. The team: team.ts. The status file: status.ts. The comments: comments.ts.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchForWorkspaceRoot } from 'vite';
import type { HotPayload, Plugin, ViteDevServer } from 'vite';

import { analyzeProject } from '@uncool-pro/orbito-cli/analyze';
import { parseRequirements, tokensToCss } from '@uncool-pro/orbito-core';
import type { DsReport, Requirement, TokenFile } from '@uncool-pro/orbito-core';

import { readComments } from './comments.ts';
import { devEndpoints } from './endpoints.ts';
import { inside, insideForReal, readJson } from './files.ts';
import { readTeam, teamDirs } from './team.ts';

const VIRTUAL = 'virtual:orbito/project';
const RESOLVED = '\0' + VIRTUAL;
const STATUS_FILE = '.orbito/status.json';
const COMMENTS_DIR = 'comments';
const FONTS_FILE = 'design-system/fonts.css';
/** Settings that pick the model mode, shown in the top bar and on the skills map. */
const SETTINGS_FILES = ['.orbito/settings.json', '.orbito/settings.local.json', '.orbito/models.json'];
// the tool's packages: linked from outside the project (file: dependencies), the dev server must be allowed to serve them
const PACKAGES_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** The stories in `requirements/**\/*.md` (the local mirror of the tracker), for the screen details. */
const readRequirements = (root: string): Requirement[] => {
  const dir = resolve(root, 'requirements');

  if (!existsSync(dir)) return [];

  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    // a link that leads out of the project is not a requirements file of this project
    .filter((f) => f.endsWith('.md') && insideForReal(root, resolve(dir, f)))
    .sort()
    .flatMap((f) => parseRequirements(`requirements/${f.split(sep).join('/')}`, readFileSync(resolve(dir, f), 'utf8')));
};

/** The report when the check itself fails: the tokens as they are, nothing else. */
const emptyReport = (tokens: TokenFile): DsReport => ({ tokens, components: [], screens: {}, issues: [], counts: { error: 0, warning: 0, info: 0 } });

export type OrbitoOptions = {
  /** The project config file, relative to the Vite root (default `orbito.config.ts`). */
  config?: string;
};

export default function orbito(options: OrbitoOptions = {}): Plugin {
  let root = process.cwd();
  let dev = false;

  /**
   * The project module carries everything read from files (statuses, comments, tokens, the report, the team): after a
   * change it is forgotten, so the next load reads the files again. `message` is what the open board gets: its new data
   * without a reload, or a full reload when the change is not something the board can take in place.
   */
  const refresh = (server: ViteDevServer, message?: HotPayload) => {
    const mod = server.moduleGraph.getModuleById(RESOLVED);

    if (mod) server.moduleGraph.invalidateModule(mod);
    if (message) server.ws.send(message);
  };
  const reload = (server: ViteDevServer) => refresh(server, { type: 'full-reload' });
  const pushComments = (server: ViteDevServer) => refresh(server, { type: 'custom', event: 'orbito:comments', data: readComments(resolve(root, COMMENTS_DIR)) });

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

      this.addWatchFile(statusPath);
      this.addWatchFile(tokensPath);
      // watching a missing file makes Vite resolve it as an import; a new fonts.css is picked up in configureServer
      if (existsSync(fontsPath)) this.addWatchFile(fontsPath);
      let report: DsReport;

      try {
        report = analyzeProject({ root });
      } catch (e) {
        this.warn(`design-system check failed: ${String(e)}`);
        report = emptyReport(readJson<TokenFile>(tokensPath, {}));
      }
      const json = (value: unknown) => JSON.stringify(value);

      return [
        `import config from ${json(configPath)};`,
        `import { loadProject } from '@uncool-pro/orbito-core';`,
        // loaded one by one: a file that throws while loading becomes a problem on the board, not an empty page
        `const settle = async (files) => Object.fromEntries(await Promise.all(Object.entries(files).map(([file, load]) => load().then((m) => [file, m], (e) => [file, { loadError: String(e) }]))));`,
        `const screens = await settle(import.meta.glob('/screens/**/*.screen.{tsx,jsx}'));`,
        `const pages = await settle(import.meta.glob('/flows/**/*.flow.{ts,tsx,js}'));`,
        `const docs = Object.values(await settle(import.meta.glob('/design-system/**/*.docs.{tsx,jsx}'))).map((m) => m.default).filter(Boolean);`,
        `const { project, problems } = loadProject(config, screens, pages);`,
        `const ds = { tokens: ${json(report.tokens)}, css: ${json(tokensToCss(report.tokens))}, report: ${json(report)}, fonts: ${json(existsSync(fontsPath) ? readFileSync(fontsPath, 'utf8') : '')}, docs };`,
        `const team = ${json(readTeam(root))};`,
        `const requirements = ${json(readRequirements(root))};`,
        `export default { project, problems, statuses: ${json(readJson(statusPath, {}))}, comments: ${json(readComments(resolve(root, COMMENTS_DIR)))}, dev: ${dev}, ds, team, requirements };`,
      ].join('\n');
    },
    configureServer(server) {
      // skills and agents (the skills map) may live outside the Vite root (the tool repository): watch them too
      const team = teamDirs(root);

      if (team) {
        server.watcher.add([team.skills, team.agents]);
        server.watcher.on('all', (_event, file) => {
          const changed = resolve(file);

          if (inside(team.skills, changed) || inside(team.agents, changed)) reload(server);
        });
      }
      // a fonts.css or a settings file created while the server runs
      const createdLater = [FONTS_FILE, '.orbito/settings.json', '.orbito/settings.local.json'].map((f) => resolve(root, f));

      server.watcher.on('add', (file) => {
        if (createdLater.includes(resolve(file))) reload(server);
      });
      // a comments file added or removed (the first comment on a screen, the last one gone, or Claude): push them all
      const commentsDir = resolve(root, COMMENTS_DIR);
      const commentsChanged = (file: string) => {
        if (inside(commentsDir, resolve(file))) pushComments(server);
      };

      server.watcher.add(commentsDir);
      server.watcher.on('add', commentsChanged);
      server.watcher.on('unlink', commentsChanged);
      server.middlewares.use(devEndpoints(root, resolve(root, STATUS_FILE), commentsDir));
    },
    handleHotUpdate({ file, server }) {
      const rel = relative(root, resolve(file)).split(sep).join('/');

      // a status change, from the board or from Claude editing the file: send the file to the browser, no reload
      // (the board that made the change already shows the new value)
      if (rel === STATUS_FILE) {
        refresh(server, { type: 'custom', event: 'orbito:status', data: readJson(resolve(root, STATUS_FILE), {}) });

        return [];
      }
      // comments, the same way: added on the board or written by Claude
      if (rel.startsWith(`${COMMENTS_DIR}/`)) {
        pushComments(server);

        return [];
      }
      // text and values the board cannot take in place: the model mode, the stories, the tokens and the typefaces
      if (SETTINGS_FILES.includes(rel) || /^requirements\/.*\.md$/.test(rel) || rel === 'design-system/tokens.json' || rel === FONTS_FILE) {
        reload(server);

        return [];
      }
      // code: Vite updates the modules itself; the project module carries the design-system report, so it is rebuilt too
      if (/^(design-system|screens|flows)\//.test(rel)) refresh(server);

      return undefined;
    },
  };
}
