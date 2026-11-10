// Dev endpoints of the board (never in a build):
//   GET  /__orbito/status                 the status file
//   POST /__orbito/status  {id,status,note?}  writes that one entry, nothing else
//   GET  /__orbito/file?path=<rel>        a .md / .txt / .json file inside the project (e.g. a review report)
//   GET  /__orbito/env                    the project folder and the system (for the developer section of screen details)
//   POST /__orbito/reveal?path=<rel>      shows a project file in Explorer / Finder / the file manager
//   GET  /__orbito/comments               every screen's comments (comments/<screen-id>/<comment-id>.md)
//   POST /__orbito/comments {action,screen,...}  adds a comment to one screen, changes its status or removes it
//   GET  /__orbito/source?path=<rel>      the code of a screen or a design-system component (dev mode)
// Every one of them, and Vite's own /__open-in-editor, answers the board only: see `fromOtherSite`.
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

import { changeComments, readComments } from './comments.ts';
import type { CommentChange } from './comments.ts';
import { RequestError } from './errors.ts';
import { insideForReal, readJson } from './files.ts';
import { saveStatus } from './status.ts';
import type { StatusChange } from './status.ts';

type Headers = Record<string, string | string[] | undefined>;

/** What the endpoints use of a request and a response: Node's own objects fit, and so does a small stand-in in a test. */
export type EndpointRequest = {
  url?: string;
  method?: string;
  headers: Headers;
  on(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
  on(event: 'end', listener: () => void): unknown;
};
export type EndpointResponse = {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body: string): unknown;
};

type Reply = (code: number, body: unknown, type?: string) => void;

const TEXT = 'text/plain; charset=utf-8';
/** The largest request the board sends is a comment of 2000 characters; anything near this size is not the board. */
const MAX_BODY = 1024 * 1024;

/**
 * The person's name as git knows it (`git config user.name`), to sign comments without asking; nothing in a container,
 * where git is not there, or when git has no name. A fixed command, no shell, a short timeout.
 */
const gitName = (root: string): string | undefined => {
  if (process.env.ORBITO_CONTAINER) return undefined;
  try {
    return (
      execFileSync('git', ['config', 'user.name'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 2000,
      })
        .trim()
        .slice(0, 80) || undefined
    );
  } catch {
    return undefined;
  }
};

/** Reads a JSON body and answers with what `handle` returns, or with the error it throws. */
const withBody = (req: EndpointRequest, reply: Reply, handle: (body: Record<string, unknown>) => unknown) => {
  const chunks: Buffer[] = [];
  let size = 0;

  req.on('data', (chunk) => {
    const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;

    size += bytes.length;
    if (size <= MAX_BODY) chunks.push(bytes);
  });
  req.on('end', () => {
    if (size > MAX_BODY) return reply(413, { error: 'the request is too large' });
    try {
      // decoded once, whole: a letter cut in half between two chunks stays one letter
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

      if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new RequestError('the request must be a JSON object');
      reply(200, handle(body as Record<string, unknown>));
    } catch (e) {
      reply(e instanceof RequestError ? e.code : 400, { error: e instanceof Error ? e.message : String(e) });
    }
  });
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const hostOf = (origin: string) => {
  try {
    return new URL(origin).host;
  } catch {
    return undefined;
  }
};

/**
 * Only the board itself may call these: a page from another site open in the same browser must not write the status
 * file (text Claude reads), open the file manager or the code editor, or read project files. The browser says where a
 * request comes from; a request with neither header comes from a terminal, not from a page.
 */
export const fromOtherSite = ({ headers }: { headers: Headers }): boolean => {
  const site = first(headers['sec-fetch-site']);
  const origin = first(headers.origin);

  if (site === 'cross-site' || site === 'same-site') return true;

  return !!origin && hostOf(origin) !== first(headers.host);
};

/** Middleware for the dev server: the endpoints above, for the project in `root`. */
export const devEndpoints =
  (root: string, statusFile: string, commentsDir = resolve(root, 'comments')) =>
  (req: EndpointRequest, res: EndpointResponse, next: () => void): void => {
    const url = new URL(req.url ?? '/', 'http://x');
    const reply: Reply = (code, body, type = 'application/json; charset=utf-8') => {
      res.statusCode = code;
      res.setHeader('Content-Type', type);
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };
    const notFound = () => reply(404, { error: 'not found' });
    /** The project file the request names, or `undefined` when the path leaves the project (also through a link) or is missing. */
    const projectFile = () => {
      const file = resolve(root, url.searchParams.get('path') ?? '');

      return insideForReal(root, file) ? file : undefined;
    };
    const only = (...methods: string[]) => {
      if (methods.includes(req.method ?? 'GET')) return true;
      reply(405, { error: methods.join(' or ') });

      return false;
    };

    // Vite's own address, which opens a file in the code editor: it stays Vite's, but another site must not reach it
    if (url.pathname === '/__open-in-editor')
      return fromOtherSite(req) ? reply(403, { error: 'requests from other sites are not allowed' }) : next();
    if (!url.pathname.startsWith('/__orbito/')) return next();
    if (fromOtherSite(req)) return reply(403, { error: 'requests from other sites are not allowed' });

    switch (url.pathname) {
      case '/__orbito/file': {
        const file = projectFile();

        if (!only('GET')) return;
        if (!file || !/\.(md|txt|json)$/i.test(file)) return notFound();

        return reply(200, readFileSync(file, 'utf8'), TEXT);
      }
      // only the code of screens and components: what dev mode shows next to a screen, nothing else in the project
      case '/__orbito/source': {
        const file = projectFile();
        const rel = file ? relative(root, file).split(sep).join('/') : '';

        if (!only('GET')) return;
        if (!file || !/^(screens|design-system)\//.test(rel) || !/\.(tsx|ts|jsx|css)$/i.test(rel)) return notFound();

        return reply(200, readFileSync(file, 'utf8'), TEXT);
      }
      case '/__orbito/comments': {
        if (!only('GET', 'POST')) return;
        if (req.method === 'POST')
          return withBody(req, reply, (change: CommentChange) => ({
            screen: change.screen,
            comments: changeComments(commentsDir, change),
          }));

        return reply(200, readComments(commentsDir));
      }
      // in a container the root is the container's; the folder on the person's computer comes from compose (ORBITO_HOST_ROOT)
      case '/__orbito/env': {
        const name = gitName(root);
        const hostRoot = process.env.ORBITO_HOST_ROOT;

        if (!only('GET')) return;

        return reply(200, {
          root: resolve(root),
          platform: process.platform,
          sep,
          container: !!process.env.ORBITO_CONTAINER,
          ...(hostRoot ? { hostRoot } : {}),
          ...(name ? { name } : {}),
        });
      }
      case '/__orbito/reveal': {
        const file = projectFile();

        if (!only('POST')) return;
        // in a container there is no file manager to open, and the system's own is out of reach
        if (process.env.ORBITO_CONTAINER) return reply(501, { error: 'not available in the container' });
        if (!file) return notFound();
        // the file manager of the system, the file selected; arguments, never a shell string
        const [cmd, args]: [string, string[]] =
          process.platform === 'win32'
            ? ['explorer.exe', [`/select,${file}`]]
            : process.platform === 'darwin'
              ? ['open', ['-R', file]]
              : ['xdg-open', [dirname(file)]];

        spawn(cmd, args, { detached: true, stdio: 'ignore' })
          .on('error', () => undefined)
          .unref();

        return reply(200, { ok: true });
      }
      case '/__orbito/status': {
        if (!only('GET', 'POST')) return;
        if (req.method === 'POST')
          return withBody(req, reply, (change: StatusChange) => ({ id: change.id, ...saveStatus(statusFile, change) }));

        return reply(200, readJson(statusFile, {}));
      }
      default:
        return next();
    }
  };
