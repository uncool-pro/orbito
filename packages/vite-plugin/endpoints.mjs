// Dev endpoints of the board (never in a build):
//   GET  /__orbito/status                 the status file
//   POST /__orbito/status  {id,status,note?}  writes that one entry, nothing else
//   GET  /__orbito/file?path=<rel>        a .md / .txt / .json file inside the project (e.g. a review report)
//   GET  /__orbito/env                    the project folder and the system (for the developer section of screen details)
//   POST /__orbito/reveal?path=<rel>      shows a project file in Explorer / Finder / the file manager
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

import { inside, readJson } from './files.mjs';
import { saveStatus } from './status.mjs';

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
 * @returns {(req: any, res: any, next: () => void) => void} middleware for the dev server
 */
export const devEndpoints = (root, statusFile) => (req, res, next) => {
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
  if (url.pathname === '/__orbito/env') return reply(200, { root: resolve(root), platform: process.platform, sep, container: !!process.env.ORBITO_CONTAINER });
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
  let raw = '';

  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    try {
      const change = JSON.parse(raw || '{}');

      reply(200, { id: change.id, ...saveStatus(statusFile, change) });
    } catch (e) {
      reply(e.code === 409 ? 409 : 400, { error: e instanceof Error ? e.message : String(e) });
    }
  });
};
