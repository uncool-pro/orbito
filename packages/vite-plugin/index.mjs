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
// 2. Dev endpoints (never in a build):
//      GET  /__orbito/status                 the status file
//      POST /__orbito/status  {id,status,note?}  writes that one entry, nothing else
//      GET  /__orbito/file?path=<rel>        a .md / .txt / .json file inside the project (e.g. a review report)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchForWorkspaceRoot } from 'vite';

import { analyzeProject } from '@uncool-pro/orbito-cli/analyze';
import { buildTeam, listOf, modelFor, parseFrontmatter, resolveMode, tokensToCss } from '@uncool-pro/orbito-core';

// keep in sync with packages/core/src/status.ts (the tool owns the list)
const STATUSES = ['todo', 'wip', 'review', 'changes', 'approved', 'onHold', 'dropped'];
const VIRTUAL = 'virtual:orbito/project';
const RESOLVED = '\0' + VIRTUAL;
const STATUS_FILE = '.orbito/status.json';
const FONTS_FILE = 'design-system/fonts.css';
// the tool's packages: linked from outside the project (file: dependencies), the dev server must be allowed to serve them
const PACKAGES_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** True when `file` is inside `dir` (works with Windows separators and drive letters). */
const inside = (dir, file) => {
  const rel = relative(dir, file);

  return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
};

/** Where the team lives: the project's .claude/ folder, or (in the tool repository, e.g. the demo) the nearest skills/ + agents/ above. */
const teamDirs = (root) => {
  if (existsSync(resolve(root, '.claude/skills'))) return { skills: resolve(root, '.claude/skills'), agents: resolve(root, '.claude/agents') };
  for (let dir = root, i = 0; i < 4; i++, dir = dirname(dir)) {
    if (existsSync(resolve(dir, 'skills')) && existsSync(resolve(dir, 'agents'))) return { skills: resolve(dir, 'skills'), agents: resolve(dir, 'agents') };
  }

  return undefined;
};

/** Reads skills and agents from their markdown files (front matter + the skills each agent's instructions name). */
const readTeam = (root) => {
  const dirs = teamDirs(root);

  if (!dirs) return null;
  const skills = (existsSync(dirs.skills) ? readdirSync(dirs.skills, { withFileTypes: true }) : [])
    .filter((d) => d.isDirectory() && existsSync(resolve(dirs.skills, d.name, 'SKILL.md')))
    .map((d) => {
      const { data, body } = parseFrontmatter(readFileSync(resolve(dirs.skills, d.name, 'SKILL.md'), 'utf8'));

      return { name: data.name || d.name, description: data.description || '', body };
    });
  const agents = (existsSync(dirs.agents) ? readdirSync(dirs.agents) : [])
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, body } = parseFrontmatter(readFileSync(resolve(dirs.agents, f), 'utf8'));

      return { name: data.name || f.replace(/\.md$/, ''), description: data.description || '', model: data.model, effort: data.effort, skills: listOf(data.skills), body };
    });

  // the model mode of the person running the viewer: environment → personal settings → the team's default
  const { mode, source } = resolveMode({
    env: process.env.ORBITO_MODELS,
    local: readJson(resolve(root, '.orbito/settings.local.json'), {}),
    team: readJson(resolve(root, '.orbito/settings.json'), {}),
  });
  const profiles = readJson(resolve(root, '.orbito/models.json'), null) ?? readJson(resolve(dirs.agents, 'models.json'), null);
  // each agent as Orbito will call it in this mode (the profile wins over the agent file's own values)
  const inMode = agents.map((a) => ({ ...a, ...(modelFor(profiles ?? undefined, mode, a.name) ?? {}) }));

  return { ...buildTeam(skills, inMode), models: mode, modelsSource: source };
};

const readJson = (file, fallback) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

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

      this.addWatchFile(statusPath);
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
        `const screens = import.meta.glob('/screens/**/*.screen.{tsx,jsx}', { eager: true });`,
        `const pages = import.meta.glob('/flows/**/*.flow.{ts,tsx,js}', { eager: true });`,
        `const docs = Object.values(import.meta.glob('/design-system/**/*.docs.{tsx,jsx}', { eager: true })).map((m) => m.default).filter(Boolean);`,
        `const { project, problems } = loadProject(config, screens, pages);`,
        `const ds = { tokens: ${JSON.stringify(report.tokens)}, css: ${JSON.stringify(tokensToCss(report.tokens))}, report: ${JSON.stringify(report)}, fonts: ${JSON.stringify(existsSync(fontsPath) ? readFileSync(fontsPath, 'utf8') : '')}, docs };`,
        `const team = ${JSON.stringify(readTeam(root))};`,
        `export default { project, problems, statuses: ${JSON.stringify(readJson(statusPath, {}))}, dev: ${dev}, ds, team };`,
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
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        const reply = (code, body, type = 'application/json; charset=utf-8') => {
          res.statusCode = code;
          res.setHeader('Content-Type', type);
          res.end(typeof body === 'string' ? body : JSON.stringify(body));
        };

        if (url.pathname === '/__orbito/file') {
          const file = resolve(root, url.searchParams.get('path') ?? '');

          if (!inside(root, file) || !/\.(md|txt|json)$/i.test(file) || !existsSync(file)) return reply(404, { error: 'not found' });

          return reply(200, readFileSync(file, 'utf8'), 'text/plain; charset=utf-8');
        }
        if (url.pathname !== '/__orbito/status') return next();
        const statusPath = resolve(root, STATUS_FILE);

        if (req.method === 'GET') return reply(200, readJson(statusPath, {}));
        if (req.method !== 'POST') return reply(405, { error: 'GET or POST' });
        let raw = '';

        req.on('data', (c) => (raw += c));
        req.on('end', () => {
          try {
            const { id, status, note } = JSON.parse(raw || '{}');

            if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) return reply(400, { error: 'invalid screen id' });
            if (!STATUSES.includes(status)) return reply(400, { error: `status must be one of: ${STATUSES.join(', ')}` });
            if (note !== undefined && note !== null && typeof note !== 'string') return reply(400, { error: 'note must be text' });
            const all = readJson(statusPath, {});

            all[id] = { status, ...(note?.trim() ? { note: note.trim() } : {}), updatedAt: new Date().toISOString().slice(0, 10) };
            const sorted = Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));

            mkdirSync(dirname(statusPath), { recursive: true });
            writeFileSync(statusPath, JSON.stringify(sorted, null, 2) + '\n');
            reply(200, { id, ...all[id] });
          } catch (e) {
            reply(400, { error: String(e) });
          }
        });
      });
    },
    handleHotUpdate(ctx) {
      const file = resolve(ctx.file);
      const rel = relative(root, file).split(sep).join('/');

      // a status write must not reload the page: the viewer already shows the new value
      if (file === resolve(root, STATUS_FILE)) return [];
      // the model mode shows in the top bar and on the skills map
      if (rel === '.orbito/settings.json' || rel === '.orbito/settings.local.json' || rel === '.orbito/models.json') {
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
