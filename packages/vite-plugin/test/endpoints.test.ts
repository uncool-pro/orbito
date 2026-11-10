import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { devEndpoints, fromOtherSite } from '../src/endpoints.ts';

const HOST = 'localhost:5190';
let root: string;
let statusFile: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'orbito-endpoints-'));
  statusFile = join(root, '.orbito/status.json');
  mkdirSync(join(root, '.orbito'));
  mkdirSync(join(root, 'reviews'));
  writeFileSync(join(root, 'reviews/report.md'), '# report');
  writeFileSync(join(root, 'secret.env'), 'hidden');
  writeFileSync(join(root, '..', 'orbito-outside.md'), 'outside');
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
  rmSync(join(root, '..', 'orbito-outside.md'), { force: true });
});

/** `body` as a list is sent chunk by chunk, the way a long request arrives. */
const call = (url: string, { method = 'GET', headers = {}, body }: { method?: string; headers?: Record<string, string>; body?: string | Buffer[] } = {}) =>
  new Promise<{ code: number; text: string; passed?: boolean }>((done) => {
    const req = Object.assign(new EventEmitter(), { url, method, headers: { host: HOST, ...headers } });
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end(text: string) {
        done({ code: res.statusCode, text });
      },
    };

    devEndpoints(root, statusFile)(req, res, () => done({ code: 0, text: '', passed: true }));
    for (const chunk of Array.isArray(body) ? body : [body ?? '']) req.emit('data', chunk);
    req.emit('end');
  });

describe('requests from other sites', () => {
  it('turns them away, whatever way the browser marks them', () => {
    const asked = (headers: Record<string, string>) => fromOtherSite({ headers: { host: HOST, ...headers } });

    expect(asked({ 'sec-fetch-site': 'cross-site' })).toBe(true);
    expect(asked({ 'sec-fetch-site': 'same-site' })).toBe(true);
    expect(asked({ origin: 'https://evil.example' })).toBe(true);
    expect(asked({ origin: 'null' })).toBe(true);
    expect(asked({ origin: 'not a url' })).toBe(true);
  });

  it('lets the board and the terminal through', () => {
    expect(fromOtherSite({ headers: { host: HOST, 'sec-fetch-site': 'same-origin', origin: `http://${HOST}` } })).toBe(false);
    expect(fromOtherSite({ headers: { host: HOST } })).toBe(false);
  });

  it('stops a write before it touches the file', async () => {
    const r = await call('/__orbito/status', { method: 'POST', headers: { origin: 'https://evil.example' }, body: JSON.stringify({ id: 'x', status: 'wip' }) });

    expect(r.code).toBe(403);
    expect(() => readFileSync(statusFile)).toThrow();
  });
});

describe('reading a file', () => {
  it('gives a report inside the project', async () => {
    expect(await call('/__orbito/file?path=reviews/report.md')).toMatchObject({ code: 200, text: '# report' });
  });

  it('refuses other file types and anything outside the project', async () => {
    expect((await call('/__orbito/file?path=secret.env')).code).toBe(404);
    expect((await call('/__orbito/file?path=../orbito-outside.md')).code).toBe(404);
    expect((await call('/__orbito/file?path=reviews/missing.md')).code).toBe(404);
  });

  it('refuses a file reached through a link that leaves the project', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'orbito-outside-'));

    writeFileSync(join(outside, 'notes.md'), 'not of this project');
    // a junction on Windows (no special rights needed), a symbolic link elsewhere
    symlinkSync(outside, join(root, 'reviews/elsewhere'), 'junction');
    try {
      expect((await call('/__orbito/file?path=reviews/elsewhere/notes.md')).code).toBe(404);
      expect((await call('/__orbito/reveal?path=reviews/elsewhere/notes.md', { method: 'POST' })).code).toBe(404);
    } finally {
      rmSync(join(root, 'reviews/elsewhere'), { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('takes GET only', async () => {
    expect((await call('/__orbito/file?path=reviews/report.md', { method: 'POST' })).code).toBe(405);
  });
});

describe('opening a file in the code editor, an address of Vite itself', () => {
  it('lets the board through and stops other sites', async () => {
    expect((await call('/__open-in-editor?file=screens/a.screen.tsx')).passed).toBe(true);
    expect((await call('/__open-in-editor?file=screens/a.screen.tsx', { headers: { 'sec-fetch-site': 'cross-site' } })).code).toBe(403);
    expect((await call('/__open-in-editor?file=screens/a.screen.tsx', { headers: { origin: 'https://evil.example' } })).code).toBe(403);
  });
});

describe('the body of a request', () => {
  const post = (body: string | Buffer[]) => call('/__orbito/comments', { method: 'POST', body });

  it('keeps a letter whole when it arrives cut in two', async () => {
    const bytes = Buffer.from(JSON.stringify({ action: 'add', screen: 'a', text: 'Zażółć gęślą jaźń' }));
    // cut inside the two bytes of "ż"
    const cut = bytes.indexOf(Buffer.from('ż')) + 1;
    const saved = await post([bytes.subarray(0, cut), bytes.subarray(cut)]);

    expect(saved.code).toBe(200);
    expect(JSON.parse(saved.text).comments[0].text).toBe('Zażółć gęślą jaźń');
  });

  it('refuses one that is too large or is not an object', async () => {
    expect((await post([Buffer.alloc(1024 * 1024 + 1, 0x20)])).code).toBe(413);
    expect((await post('null')).code).toBe(400);
    expect((await post('[]')).code).toBe(400);
    expect(existsSync(join(root, 'comments'))).toBe(false);
  });
});

describe('showing a file in the system', () => {
  it('takes POST only', async () => {
    expect((await call('/__orbito/reveal?path=reviews/report.md')).code).toBe(405);
  });

  it('refuses anything outside the project', async () => {
    expect((await call('/__orbito/reveal?path=../orbito-outside.md', { method: 'POST' })).code).toBe(404);
  });

  it('is not available in a container', async () => {
    vi.stubEnv('ORBITO_CONTAINER', '1');
    expect((await call('/__orbito/reveal?path=reviews/report.md', { method: 'POST' })).code).toBe(501);
    expect(JSON.parse((await call('/__orbito/env')).text).container).toBe(true);
  });
});

describe('statuses', () => {
  it('saves one entry and reads it back', async () => {
    const saved = await call('/__orbito/status', { method: 'POST', body: JSON.stringify({ id: 'flow:a/b', status: 'review' }) });

    expect(saved.code).toBe(200);
    expect(JSON.parse((await call('/__orbito/status')).text)['flow:a/b'].status).toBe('review');
  });

  it('answers 400 to a wrong request and 409 to a damaged file', async () => {
    expect((await call('/__orbito/status', { method: 'POST', body: JSON.stringify({ id: 'x', status: 'nope' }) })).code).toBe(400);
    expect((await call('/__orbito/status', { method: 'POST', body: 'not json' })).code).toBe(400);
    writeFileSync(statusFile, '<<<<<<< HEAD');
    expect((await call('/__orbito/status', { method: 'POST', body: JSON.stringify({ id: 'x', status: 'wip' }) })).code).toBe(409);
    expect(readFileSync(statusFile, 'utf8')).toBe('<<<<<<< HEAD');
  });

  it('takes GET and POST only', async () => {
    expect((await call('/__orbito/status', { method: 'DELETE' })).code).toBe(405);
  });

  it('keeps an id that is also a built-in name of JavaScript as an ordinary entry', async () => {
    expect((await call('/__orbito/status', { method: 'POST', body: JSON.stringify({ id: '__proto__', status: 'review' }) })).code).toBe(200);
    await call('/__orbito/status', { method: 'POST', body: JSON.stringify({ id: 'flow:a/b', status: 'wip' }) });
    expect(readFileSync(statusFile, 'utf8')).toContain('"__proto__": {');
    expect(Object.keys(JSON.parse(readFileSync(statusFile, 'utf8'))).sort()).toEqual(['__proto__', 'flow:a/b']);
  });
});

describe('comments', () => {
  const post = (body: unknown) => call('/__orbito/comments', { method: 'POST', body: JSON.stringify(body) });

  it('adds each comment as its own open file, moves it along and removes it', async () => {
    const added = await post({ action: 'add', screen: 'plant-list', text: '  Too many filters  ', author: 'Ola' });

    expect(added.code).toBe(200);
    await post({ action: 'add', screen: 'plant-list', text: 'Bigger buttons' });
    const list = JSON.parse((await call('/__orbito/comments')).text)['plant-list'];

    // two comments, two files, in the order they were written
    expect(list.map((c: { text: string }) => c.text)).toEqual(['Too many filters', 'Bigger buttons']);
    expect(readdirSync(join(root, 'comments/plant-list'))).toHaveLength(2);
    const [c] = list;
    const file = join(root, `comments/plant-list/${c.id}.md`);

    expect(c).toMatchObject({ author: 'Ola', status: 'open' });
    expect(readFileSync(file, 'utf8')).toMatch(/^---\nstatus: open\nauthor: Ola\ncreated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\n---\nToo many filters\n$/);
    expect((await post({ action: 'status', screen: 'plant-list', id: c.id, status: 'done', note: 'moved the filters into a sheet' })).code).toBe(200);
    expect(readFileSync(file, 'utf8')).toContain('status: done\n');
    expect(readFileSync(file, 'utf8')).toContain('note: moved the filters into a sheet\n');
    for (const x of JSON.parse((await call('/__orbito/comments')).text)['plant-list']) await post({ action: 'remove', screen: 'plant-list', id: x.id });
    // a screen with no comments left has no folder
    expect(existsSync(join(root, 'comments/plant-list'))).toBe(false);
  });

  it('refuses a wrong request, an unknown comment and a file with a merge conflict', async () => {
    expect((await post({ action: 'add', screen: '../x', text: 'a' })).code).toBe(400);
    expect((await post({ action: 'add', screen: 'a', text: ' ' })).code).toBe(400);
    expect((await post({ action: 'add', screen: 'a', text: 'x'.repeat(2001) })).code).toBe(400);
    expect((await post({ action: 'status', screen: 'a', id: 'nope', status: 'done' })).code).toBe(404);
    expect((await post({ action: 'status', screen: 'a', id: '../../secret', status: 'done' })).code).toBe(404);
    await post({ action: 'add', screen: 'a', text: 'b' });
    const id = JSON.parse((await call('/__orbito/comments')).text).a[0].id;

    expect((await post({ action: 'status', screen: 'a', id, status: 'closed' })).code).toBe(400);
    writeFileSync(join(root, `comments/a/${id}.md`), '<<<<<<< HEAD\n---\nstatus: open\n');
    expect((await post({ action: 'status', screen: 'a', id, status: 'done' })).code).toBe(409);
    expect(readFileSync(join(root, `comments/a/${id}.md`), 'utf8')).toContain('<<<<<<< HEAD');
  });

  it('never leaves the comments folder: no screen or comment called "." or ".."', async () => {
    writeFileSync(join(root, 'README.md'), '# the project');
    for (const screen of ['..', '.', '.hidden']) {
      expect((await post({ action: 'add', screen, text: 'a' })).code).toBe(400);
      expect((await post({ action: 'remove', screen, id: 'README' })).code).toBe(400);
      expect((await post({ action: 'status', screen, id: 'README', status: 'done' })).code).toBe(400);
    }
    await post({ action: 'add', screen: 'a', text: 'b' });
    expect((await post({ action: 'remove', screen: 'a', id: '..' })).code).toBe(404);
    // nothing written next to the project's own files, nothing removed
    expect(readdirSync(root).sort()).toEqual(['.orbito', 'README.md', 'comments', 'reviews', 'secret.env']);
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toBe('# the project');
  });

  it('stops a comment from another site', async () => {
    expect((await call('/__orbito/comments', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' }, body: '{}' })).code).toBe(403);
  });
});

describe('source code for dev mode', () => {
  it('gives the code of screens and components only', async () => {
    mkdirSync(join(root, 'screens'));
    writeFileSync(join(root, 'screens/start.screen.tsx'), 'export default 1');
    expect(await call('/__orbito/source?path=screens/start.screen.tsx')).toMatchObject({ code: 200, text: 'export default 1' });
    expect((await call('/__orbito/source?path=reviews/report.md')).code).toBe(404);
    expect((await call('/__orbito/source?path=secret.env')).code).toBe(404);
    expect((await call('/__orbito/source?path=screens/../secret.env')).code).toBe(404);
  });
});

it('leaves every other address to the dev server', async () => {
  expect((await call('/src/main.tsx')).passed).toBe(true);
  expect((await call('/__orbito/unknown')).passed).toBe(true);
});
