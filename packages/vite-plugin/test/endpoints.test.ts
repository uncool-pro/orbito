import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { devEndpoints, fromOtherSite } from '../endpoints.mjs';

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

const call = (url: string, { method = 'GET', headers = {}, body }: { method?: string; headers?: Record<string, string>; body?: string } = {}) =>
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
    req.emit('data', body ?? '');
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
});

describe('comments', () => {
  const post = (body: unknown) => call('/__orbito/comments', { method: 'POST', body: JSON.stringify(body) });

  it('adds a comment to a screen and resolves it', async () => {
    const added = await post({ action: 'add', screen: 'plant-list', text: '  Too many filters  ', author: 'Ola' });

    expect(added.code).toBe(200);
    const [c] = JSON.parse(added.text).comments;

    expect(c).toMatchObject({ text: 'Too many filters', author: 'Ola' });
    expect(JSON.parse((await call('/__orbito/comments')).text)['plant-list']).toHaveLength(1);
    expect((await post({ action: 'resolve', screen: 'plant-list', id: c.id })).code).toBe(200);
    // a screen without comments leaves the file
    expect(JSON.parse(readFileSync(join(root, '.orbito/comments.json'), 'utf8'))).toEqual({});
  });

  it('refuses a wrong request, an unknown comment and a damaged file', async () => {
    expect((await post({ action: 'add', screen: '../x', text: 'a' })).code).toBe(400);
    expect((await post({ action: 'add', screen: 'a', text: ' ' })).code).toBe(400);
    expect((await post({ action: 'add', screen: 'a', text: 'x'.repeat(2001) })).code).toBe(400);
    expect((await post({ action: 'resolve', screen: 'a', id: 'nope' })).code).toBe(404);
    writeFileSync(join(root, '.orbito/comments.json'), '<<<<<<< HEAD');
    expect((await post({ action: 'add', screen: 'a', text: 'b' })).code).toBe(409);
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
