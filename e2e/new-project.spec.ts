// The whole road of a new user, without Docker: create a project, check it, build it, open the board, set a status.
import { execFileSync, execSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5192;
const windows = process.platform === 'win32';

// on Windows npm is a .cmd script, which only a shell can start: one fixed command line there
const npm = (cwd: string, ...args: string[]) =>
  windows ? execSync(`npm ${args.join(' ')}`, { cwd, encoding: 'utf8', stdio: 'pipe' }) : execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: 'pipe' });

test.describe.serial('a new project', () => {
  test.setTimeout(300_000);
  let dir: string;
  let project: string;
  let server: ChildProcess | undefined;

  test.beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'orbito-e2e-'));
    project = join(dir, 'moj-produkt');
    execFileSync(process.execPath, [join(REPO, 'packages/create/src/index.ts'), project, '--title', 'Mój produkt', '--platform', 'web', '--locale', 'pl'], { stdio: 'pipe', timeout: 240_000 });
  });

  test.afterAll(() => {
    if (server?.pid) {
      if (windows) execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-server.pid);
    }
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  });

  test('has the template and the record of what Orbito installed', () => {
    expect(existsSync(join(project, '.claude/skills'))).toBe(true);
    expect(existsSync(join(project, '.orbito/managed.json'))).toBe(true);
    expect(existsSync(join(project, 'compose.yaml'))).toBe(false);
    expect(readFileSync(join(project, '.orbito/runtime'), 'utf8').trim()).toBe('local');
  });

  test('passes the design-system check and the type check', () => {
    expect(npm(project, 'run', 'check:ds')).toContain('0 errors, 0 warnings');
    npm(project, 'run', 'typecheck');
  });

  test('builds into a static site', () => {
    npm(project, 'run', 'build');
    expect(existsSync(join(project, 'dist/index.html'))).toBe(true);
  });

  test('updating right away keeps the project working and writes no backups', () => {
    execFileSync(process.execPath, [join(REPO, 'packages/cli/src/bin.ts'), 'update'], { cwd: project, stdio: 'pipe' });
    expect(existsSync(join(project, '.orbito/backup'))).toBe(false);
    expect(npm(project, 'run', 'check:ds')).toContain('0 errors');
  });

  test('opens on the board, and a status set there lands in the file', async ({ page }) => {
    const dev = ['run', 'dev', '--', '--port', String(PORT), '--strictPort'];

    server = windows ? spawn(`npm ${dev.join(' ')}`, { cwd: project, shell: true, stdio: 'ignore' }) : spawn('npm', dev, { cwd: project, stdio: 'ignore', detached: true });
    await expect(async () => {
      expect((await fetch(`http://localhost:${PORT}/`)).ok).toBe(true);
    }).toPass({ timeout: 60_000 });
    await page.goto(`http://localhost:${PORT}/#/board`);
    await expect(page.locator('[data-card]').first()).toBeVisible();
    await expect(page.locator('.pd-crumbs')).toContainText('Mój produkt');
    const status = page.locator('.pd-insp__features select').first();

    await status.selectOption('review');
    await expect(async () => {
      expect(Object.values(JSON.parse(readFileSync(join(project, '.orbito/status.json'), 'utf8'))).map((e) => (e as { status: string }).status)).toContain('review');
    }).toPass({ timeout: 5_000 });
  });
});
