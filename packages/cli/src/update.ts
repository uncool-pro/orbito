/**
 * `orbito update` — brings a project up to date with the Orbito it is linked to.
 *
 * 1. With `--pull`: updates the tool itself (`git pull --ff-only` in the Orbito folder, then `npm install` there). The
 *    code running now is then the old version, so the new version does step 2: its migrations work on the first run.
 * 2. Refreshes what Orbito owns inside the project (`install.ts`).
 * The project's own work (screens, flows, design system, process and status files, raw/) is never touched; template
 * changes such as new base components are listed in CHANGELOG.md for Orbito to apply on request.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installTeam, toolVersion } from './install.ts';
import type { InstallResult } from './install.ts';
import { fingerprint, MANIFEST } from './manifest.ts';

export { fingerprint, MANIFEST };

/** The Orbito folder (the repository with skills/, agents/, templates/) this CLI runs from. */
export const toolRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const git = (cwd: string, args: string[]) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

export type UpdateResult = InstallResult & { tool: { from: string; to: string; commits?: string[] } };

/** The refresh, done by the version just pulled. */
const refreshWithNewVersion = (tool: string, root: string): InstallResult => {
  const r = spawnSync(process.execPath, [join(tool, 'packages/cli/src/bin.ts'), 'update', '--json', '--root', root], { encoding: 'utf8' });

  if (r.status) throw new Error(`the new version of Orbito could not finish the update:\n${r.stderr || r.stdout}`);

  return JSON.parse(r.stdout) as InstallResult;
};

export const updateProject = ({ root, pull, install = true, tool = toolRoot(), today }: { root: string; pull?: boolean; install?: boolean; tool?: string; today?: string }): UpdateResult => {
  if (!existsSync(join(tool, 'skills')) || !existsSync(join(tool, 'agents'))) throw new Error(`no skills/ and agents/ in the Orbito folder ${tool}`);
  root = resolve(root);
  if (root === resolve(tool)) throw new Error('run it in your project, not in the Orbito folder');
  const from = toolVersion(tool);
  let toolChange: UpdateResult['tool'] = { from, to: from };
  let pulled = false;

  if (pull) {
    if (!existsSync(join(tool, '.git'))) {
      throw new Error(
        `the Orbito folder was not downloaded with git, so it cannot fetch updates by itself: ${tool}\n` +
          `  Your projects keep working, they link to this path. To update, replace the folder and keep its path:\n` +
          `    1. move or rename the folder\n` +
          `    2. download the new version to the same path, either way:\n` +
          `         git clone https://github.com/uncool-pro/orbito "${tool}"   (later updates then work by themselves)\n` +
          `         or unpack https://github.com/uncool-pro/orbito/archive/refs/heads/main.zip there\n` +
          `    3. npm install --prefix "${tool}"\n` +
          `    4. in your project, run: npx --no orbito update`,
      );
    }
    const before = git(tool, ['rev-parse', 'HEAD']);

    git(tool, ['pull', '--ff-only']);
    const after = git(tool, ['rev-parse', 'HEAD']);

    toolChange = { from: `${from} (${before.slice(0, 7)})`, to: `${toolVersion(tool)} (${after.slice(0, 7)})` };
    if (before !== after) {
      pulled = true;
      toolChange.commits = git(tool, ['log', '--format=%s', `${before}..${after}`]).split('\n').filter(Boolean);
      if (install) {
        const r = spawnSync('npm', ['install'], { cwd: tool, stdio: 'inherit', shell: process.platform === 'win32' });

        if (r.status) throw new Error('npm install failed in the Orbito folder');
      }
    }
  }

  const result = pulled ? refreshWithNewVersion(tool, root) : installTeam({ root, tool, today });

  if (process.env.ORBITO_CONTAINER) {
    writeFileSync(join(root, '.orbito', 'runtime'), 'docker\n');
    // mounted on its own: if it were missing, Docker would create a folder in its place
    if (!existsSync(join(root, '.orbito', 'status.json'))) writeFileSync(join(root, '.orbito', 'status.json'), '{}\n');
  }
  // projects created before `npm run update` existed get the script once
  const pkgFile = join(root, 'package.json');

  if (existsSync(pkgFile)) {
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as { scripts?: Record<string, string> };

    if (pkg.scripts && !pkg.scripts.update) {
      pkg.scripts.update = 'orbito update --pull';
      writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
      result.added.push('npm script update');
    }
  }

  return { ...result, tool: toolChange };
};
