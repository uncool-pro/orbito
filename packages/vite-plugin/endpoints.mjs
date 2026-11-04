// Dev endpoints of the board (never in a build):
//   GET  /__orbito/status                 the status file
//   POST /__orbito/status  {id,status,note?}  writes that one entry, nothing else
//   GET  /__orbito/file?path=<rel>        a .md / .txt / .json file inside the project (e.g. a review report)
//   GET  /__orbito/env                    the project folder and the system (for the developer section of screen details)
//   POST /__orbito/reveal?path=<rel>      shows a project file in Explorer / Finder / the file manager
//   GET  /__orbito/comments               every screen's comments (comments/<screen-id>.md)
//   POST /__orbito/comments {action,screen,...}  adds a comment to one screen, changes its status or removes it
//   GET  /__orbito/source?path=<rel>      the code of a screen or a design-system component (dev mode)
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

import { changeComments, readComments } from './comments.mjs';
import { inside, readJson } from './files.mjs';
import { saveStatus } from './status.mjs';

/**
 * The person's name as git knows it (`git config user.name`), to sign comments without asking; nothing in a container,
 * where git is not there, or when git has no name. A fixed command, no shell, a short timeout.
 */
const gitName = (root) => {
  if (process.env.ORBITO_CONTAINER) return undefined;
  try {
    return execFileSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).trim().slice(0, 80) || undefined;
  } catch {
    return undefined;
  }
};

/** Reads a JSON body and answers with what `handle` returns, or with the error it throws. */
const withBody = (req, reply, handle) => {
  let raw = '';

  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    try {
      reply(200, handle(JSON.parse(raw || '{}')));
    } catch (e) {
      reply(e.code === 409 || e.code === 404 ? e.code : 400, { error: e instanceof Error ? e.message : String(e) });
    }
  });
};

const hostOf = (origin) => {
  try {
    return new URL(origin).host;
  } catch {
    return undefined;
  }
};

/** Only the board itself may call these: a page from another site open in the same browser must not write the status file (text Claude reads), open the file manager or read project files. The browser says where a request comes from. */
export const fromOtherSite = ({ headers }) => {
  const site = headers['sec-fetch-site'];
  const origin = headers.origin;

  if (site === 'cross-site' || site === 'same-site') return true;

  return !!origin && hostOf(origin) !== headers.host;
};

/**
 * @param {string} root the project folder
 * @param {string} statusFile the status file
 * @param {string} [commentsDir] the comments folder
 * @returns {(req: any, res: any, next: () => void) => void} middleware for the dev server
 */
export const devEndpoints = (root, statusFile, commentsDir = resolve(root, 'comments')) => (req, res, next) => {
  const url = new URL(req.url ?? '/', 'http://x');

  if (!url.pathname.startsWith('/__orbito/')) return next();
  const reply = (code, body, type = 'application/json; charset=utf-8') => {
    res.statusCode = code;
    res.setHeader('Content-Type', type);
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  if (fromOtherSite(req)) return reply(403, { error: 'requests from other sites are not allowed' });
  if (url.pathname === '/__orbito/file') {
    const file = resolve(root, url.searchParams.get('path') ?? '');

    if (!inside(root, file) || !/\.(md|txt|json)$/i.test(file) || !existsSync(file)) return reply(404, { error: 'not found' });

    return reply(200, readFileSync(file, 'utf8'), 'text/plain; charset=utf-8');
  }
  // only the code of screens and components: what dev mode shows next to a screen, nothing else in the project
  if (url.pathname === '/__orbito/source') {
    const file = resolve(root, url.searchParams.get('path') ?? '');
    const rel = relative(root, file).split(sep).join('/');

    // a link inside the project that points elsewhere is followed by the system: check where the file really is
    if (!inside(root, file) || !/^(screens|design-system)\//.test(rel) || !/\.(tsx|ts|jsx|css)$/i.test(rel) || !existsSync(file) || !inside(realpathSync(root), realpathSync(file)))
      return reply(404, { error: 'not found' });

    return reply(200, readFileSync(file, 'utf8'), 'text/plain; charset=utf-8');
  }
  if (url.pathname === '/__orbito/comments') {
    if (req.method === 'GET') return reply(200, readComments(commentsDir));
    if (req.method !== 'POST') return reply(405, { error: 'GET or POST' });

    return withBody(req, reply, (change) => ({ screen: change.screen, comments: changeComments(commentsDir, change) }));
  }
  // in a container the root is the container's; the folder on the person's computer comes from compose (ORBITO_HOST_ROOT)
  if (url.pathname === '/__orbito/env') {
    const name = gitName(root);

    return reply(200, { root: resolve(root), platform: process.platform, sep, container: !!process.env.ORBITO_CONTAINER, ...(process.env.ORBITO_HOST_ROOT ? { hostRoot: process.env.ORBITO_HOST_ROOT } : {}), ...(name ? { name } : {}) });
  }
  if (url.pathname === '/__orbito/reveal') {
    const file = resolve(root, url.searchParams.get('path') ?? '');

    if (req.method !== 'POST') return reply(405, { error: 'POST' });
    // in a container there is no file manager to open, and the system's own is out of reach
    if (process.env.ORBITO_CONTAINER) return reply(501, { error: 'not available in the container' });
    if (!inside(root, file) || !existsSync(file)) return reply(404, { error: 'not found' });
    // the file manager of the system, the file selected; arguments, never a shell string
    const [cmd, args] =
      process.platform === 'win32' ? ['explorer.exe', [`/select,${file}`]] : process.platform === 'darwin' ? ['open', ['-R', file]] : ['xdg-open', [dirname(file)]];

    spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => undefined).unref();

    return reply(200, { ok: true });
  }
  if (url.pathname !== '/__orbito/status') return next();

  if (req.method === 'GET') return reply(200, readJson(statusFile, {}));
  if (req.method !== 'POST') return reply(405, { error: 'GET or POST' });

  return withBody(req, reply, (change) => ({ id: change.id, ...saveStatus(statusFile, change) }));
};
