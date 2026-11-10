// The whole road in the container, and what the seal promises. Runs only with a built image: ORBITO_IMAGE=orbito:dev npm run test:e2e
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const IMAGE = process.env.ORBITO_IMAGE;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = (JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { version: string }).version;
const BOARD = 'http://localhost:5190';

// on Linux the container must run as you, as DOCKER.md tells people; Docker Desktop on Windows and Mac maps it by itself
const LINUX = process.platform === 'linux';
const ME = LINUX ? `${process.getuid!()}:${process.getgid!()}` : '';
const AS_ME = LINUX ? ['--user', ME] : [];
const ENV = LINUX
  ? { ...process.env, ORBITO_UID: String(process.getuid!()), ORBITO_GID: String(process.getgid!()) }
  : process.env;

const docker = (cwd: string, ...args: string[]) =>
  execFileSync('docker', args, { cwd, env: ENV, encoding: 'utf8', stdio: 'pipe', timeout: 180_000 });
const refuses = (cwd: string, ...args: string[]) => expect(() => docker(cwd, ...args)).toThrow();

// GitHub's Linux machines sometimes lose a load of the board (see "opens the board, only for this computer"): a person
// would reload, so the later tests do too, up to three times. Each reload is a warning in the pull request, so a real
// problem does not hide behind it.
const openBoard = async (page: Page) => {
  for (let attempt = 1; ; attempt++) {
    if (attempt === 1) await page.goto(`${BOARD}/#/board`);
    else await page.reload();
    try {
      await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 45_000 });

      return;
    } catch (e) {
      if (attempt >= 3) throw e;
      if (process.env.GITHUB_ACTIONS)
        console.log(`::warning title=Board reloaded (attempt ${attempt})::${String(e).split('\n')[0]}`);
    }
  }
};

test.describe
  .serial('Orbito in a container', () => {
    test.skip(!IMAGE, 'set ORBITO_IMAGE to a built image');
    test.setTimeout(240_000);
    let dir: string;
    let project: string;

    test.beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), 'orbito-docker-'));
      project = join(dir, 'moj-produkt');
      // the project's compose.yaml names the published image: the one under test stands in for it
      docker(dir, 'tag', IMAGE!, `ghcr.io/uncool-pro/orbito:${VERSION}`);
      docker(
        dir,
        'run',
        '--rm',
        ...AS_ME,
        '--network',
        'none',
        '-v',
        `${dir}:/work`,
        '-w',
        '/work',
        IMAGE!,
        'create',
        'moj-produkt',
        '--title',
        'Mój produkt',
        '--platform',
        'web',
        '--locale',
        'pl',
      );
    });

    test.afterAll(() => {
      try {
        // when creating failed there is no project to stop
        if (existsSync(project)) docker(project, 'compose', 'down', '--timeout', '2');
        // a stand-in left under the published name would hide the real image later
        docker(dir, 'rmi', `ghcr.io/uncool-pro/orbito:${VERSION}`);
      } finally {
        rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
      }
    });

    test('creates a project with no packages on the computer, ready for the board', () => {
      expect(existsSync(join(project, 'node_modules'))).toBe(false);
      expect(readFileSync(join(project, '.orbito/runtime'), 'utf8').trim()).toBe('docker');
      expect(readFileSync(join(project, 'compose.yaml'), 'utf8')).toContain(`orbito:${VERSION}`);
      expect(existsSync(join(project, '.orbito/managed.json'))).toBe(true);
      expect(existsSync(join(project, '.orbito/status.json'))).toBe(true);
      for (const folder of ['screens', 'flows', 'design-system', 'public', 'src', 'content', 'reviews'])
        expect(existsSync(join(project, folder)), folder).toBe(true);
    });

    test('checks the design system and the types inside the container', () => {
      expect(docker(project, 'compose', 'run', '--rm', 'tools', 'check', 'ds')).toContain('0 errors, 0 warnings');
      docker(project, 'compose', 'run', '--rm', 'tools', 'typecheck');
    });

    test('opens the board, only for this computer', async ({ page, request }) => {
      const errors: string[] = [];
      const failed: string[] = [];
      const pending = new Set<string>();

      page.on('request', (r) => pending.add(r.url()));
      page.on('requestfinished', (r) => pending.delete(r.url()));
      page.on('requestfailed', (r) => {
        pending.delete(r.url());
        failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`);
      });
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text());
      });
      page.on('response', (r) => {
        if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`);
      });
      docker(project, 'compose', 'up', '-d');
      await expect(async () => {
        expect((await request.get(BOARD)).ok()).toBe(true);
      }).toPass({ timeout: 90_000 });
      expect(docker(project, 'compose', 'port', 'gate', '5190').trim()).toBe('127.0.0.1:5190');
      expect((await request.get(BOARD)).headers()['content-security-policy']).toContain("default-src 'self'");
      // what the page did, to say why when the screens do not show
      const report = async () => {
        const logs = docker(project, 'compose', 'logs', '--no-color', '--tail', '60', 'renderer');
        const shown = (
          await page
            .locator('body')
            .innerText()
            .catch(() => '')
        ).slice(0, 300);

        return `--- page errors:\n${errors.join('\n')}\n--- failed requests:\n${failed.join('\n')}\n--- still waiting for:\n${[...pending].join('\n')}\n--- page text:\n${shown}\n--- renderer:\n${logs}`;
      };

      for (let attempt = 1; ; attempt++) {
        errors.length = 0;
        failed.length = 0;
        pending.clear();
        // the same address again is the same page to the browser: only a reload loads it anew
        if (attempt === 1) await page.goto(`${BOARD}/#/board`);
        else await page.reload();
        try {
          await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 45_000 });
          break;
        } catch (e) {
          // GitHub's Linux machines sometimes lose the first load (Chrome drops requests when Docker adds a network
          // interface, or a request never answers); a person would reload. Each reload is reported as a warning in the
          // pull request, so a real problem does not hide behind it.
          if (attempt < 3) {
            if (process.env.GITHUB_ACTIONS)
              console.log(
                `::warning title=Board reloaded (attempt ${attempt})::${(await report()).replace(/\r?\n/g, '%0A')}`,
              );
            continue;
          }
          throw new Error(`${String(e)}\n${await report()}`);
        }
      }
      await expect(page.locator('.pd-crumbs')).toContainText('Mój produkt');
      expect(errors).toEqual([]);
    });

    test('shows a change made from outside the container by itself', async ({ page }) => {
      await openBoard(page);
      const screens = readdirSync(join(project, 'screens'), { recursive: true, encoding: 'utf8' }).filter((f) =>
        f.endsWith('.screen.tsx'),
      );
      const file = join(project, 'screens', screens[0]!);
      const before = readFileSync(file, 'utf8');
      const title = /title: '([^']+)'/.exec(before)?.[1];

      expect(title).toBeTruthy();
      writeFileSync(file, before.replace(`title: '${title}'`, "title: 'Zmiana z zewnątrz'"));
      await expect(page.locator('.pd-tree, [data-card]').filter({ hasText: 'Zmiana z zewnątrz' }).first()).toBeVisible({
        timeout: 30_000,
      });
      writeFileSync(file, before);
    });

    test('saves a status from the board into the project', async ({ page }) => {
      await openBoard(page);
      await page.locator('.pd-insp__features select').first().selectOption('review');
      await expect(async () => {
        expect(readFileSync(join(project, '.orbito/status.json'), 'utf8')).toContain('"review"');
      }).toPass({ timeout: 10_000 });
    });

    test('saves a comment into the project and knows the folder on this computer', async ({ request }) => {
      const added = await request.post(`${BOARD}/__orbito/comments`, {
        data: { action: 'add', screen: 'start', text: 'Z kontenera' },
      });

      expect(added.ok()).toBe(true);
      expect(
        readdirSync(join(project, 'comments/start'))
          .map((f) => readFileSync(join(project, 'comments/start', f), 'utf8'))
          .join(),
      ).toContain('Z kontenera');
      // dev mode shows real paths: compose passes the project folder in
      expect(
        ((await (await request.get(`${BOARD}/__orbito/env`)).json()) as { hostRoot?: string }).hostRoot,
      ).toBeTruthy();
    });

    test('keeps its promises: no internet, no other files, nothing to write', () => {
      mkdirSync(join(project, 'raw'), { recursive: true });
      writeFileSync(join(project, 'raw/poufne.md'), 'tajne');
      writeFileSync(join(project, '.env'), 'KLUCZ=tajny');
      const inside = (...args: string[]) => ['compose', 'exec', '-T', 'renderer', ...args];

      refuses(
        project,
        ...inside('node', '-e', "fetch('https://example.com').then(() => process.exit(0), () => process.exit(1))"),
      );
      refuses(project, ...inside('ls', '/project/raw'));
      refuses(project, ...inside('ls', '/project/.env'));
      refuses(project, ...inside('ls', '/project/.git'));
      refuses(project, ...inside('touch', '/project/screens/zapis'));
      refuses(project, ...inside('touch', '/project/orbito.config.ts'));
      refuses(project, ...inside('touch', '/orbito/zapis'));
      expect(docker(project, ...inside('id', '-u')).trim()).not.toBe('0');
    });

    test('exports one page as a static site', () => {
      docker(project, 'compose', 'run', '--rm', 'export', 'start');
      expect(existsSync(join(project, 'site/index.html'))).toBe(true);
    });

    test('switches the model mode, the one writable tool', () => {
      expect(docker(project, 'compose', 'run', '--rm', 'admin', 'models', 'high')).toContain('models: high');
    });

    test('updates the project from the image without touching the work or making copies', () => {
      const screens = readdirSync(join(project, 'screens'), { recursive: true, encoding: 'utf8' }).length;

      docker(project, 'run', '--rm', ...AS_ME, '--network', 'none', '-v', `${project}:/project`, IMAGE!, 'update');
      expect(readdirSync(join(project, 'screens'), { recursive: true, encoding: 'utf8' }).length).toBe(screens);
      expect(existsSync(join(project, '.orbito/backup'))).toBe(false);
      expect(readFileSync(join(project, 'raw/poufne.md'), 'utf8')).toBe('tajne');
    });
  });
