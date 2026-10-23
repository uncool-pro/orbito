/**
 * `orbito update` — brings a project up to date with the Orbito it is linked to.
 *
 * 1. With `--pull`: updates the tool itself (`git pull --ff-only` in the Orbito folder, then `npm install` there).
 * 2. Refreshes what Orbito owns inside the project: the skills (`.claude/skills/<name>`), the agents (`.claude/agents`)
 *    and Orbito's commands (`.claude/commands`). Skills and agents the person added themselves are left alone.
 * The project's own work (screens, flows, design system, .orbito/, raw/) is never touched; template changes such as new
 * base components are listed in CHANGELOG.md for Orbito to apply on request.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LOCAL_SETTINGS, PROFILES } from './models.ts';

/** Files that are personal to each person and never shared through git. */
const PERSONAL_FILES = [LOCAL_SETTINGS, 'feedback.md'];

/** Skills renamed or removed in Orbito: deleted from projects so two versions do not compete. */
const RETIRED_SKILLS = ['orbito-lead', 'ux-design', 'requirements', 'rapid-prototyping', 'landing-page', 'sales-copy'];
/** Agents whose work moved to other roles. */
const RETIRED_AGENTS = ['prototyper', 'copywriter'];

/** The Orbito folder (the repository with skills/, agents/, templates/) this CLI runs from. */
export const toolRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const git = (cwd: string, args: string[]) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

const version = (root: string) => {
  try {
    return (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string }).version ?? '?';
  } catch {
    return '?';
  }
};

/** Same files with the same content? (folders compared file by file) */
const same = (a: string, b: string): boolean => {
  if (!existsSync(b)) return false;
  if (statSync(a).isDirectory()) {
    const names = readdirSync(a);

    return statSync(b).isDirectory() && names.length === readdirSync(b).length && names.every((n) => same(join(a, n), join(b, n)));
  }

  return readFileSync(a).equals(readFileSync(b));
};

export type UpdateResult = {
  tool: { from: string; to: string; commits?: string[] };
  added: string[];
  updated: string[];
  removed: string[];
};

export const updateProject = ({ root, pull, install = true }: { root: string; pull?: boolean; install?: boolean }): UpdateResult => {
  const tool = toolRoot();

  if (!existsSync(join(tool, 'skills')) || !existsSync(join(tool, 'agents'))) throw new Error(`no skills/ and agents/ in the Orbito folder ${tool}`);
  if (resolve(root) === resolve(tool)) throw new Error('run it in your project, not in the Orbito folder');
  const result: UpdateResult = { tool: { from: version(tool), to: version(tool) }, added: [], updated: [], removed: [] };

  if (pull) {
    if (!existsSync(join(tool, '.git'))) {
      throw new Error(
        `the Orbito folder is not a git clone, so it cannot pull updates: ${tool}\n` +
          `  make it one (your projects keep working, they link to this path):\n` +
          `    1. move or rename the folder\n` +
          `    2. git clone https://github.com/uncool-pro/orbito "${tool}"\n` +
          `    3. npm install --prefix "${tool}"\n` +
          `  then run orbito update again`,
      );
    }
    const before = git(tool, ['rev-parse', 'HEAD']);

    git(tool, ['pull', '--ff-only']);
    const after = git(tool, ['rev-parse', 'HEAD']);

    result.tool = { from: `${result.tool.from} (${before.slice(0, 7)})`, to: `${version(tool)} (${after.slice(0, 7)})` };
    if (before !== after) {
      result.tool.commits = git(tool, ['log', '--format=%s', `${before}..${after}`]).split('\n').filter(Boolean);
      if (install) {
        const r = spawnSync('npm', ['install'], { cwd: tool, stdio: 'inherit', shell: process.platform === 'win32' });

        if (r.status) throw new Error('npm install failed in the Orbito folder');
      }
    }
  }

  const copy = (from: string, to: string, label: string) => {
    if (same(from, to)) return;
    (existsSync(to) ? result.updated : result.added).push(label);
    rmSync(to, { recursive: true, force: true });
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  };
  const claude = join(root, '.claude');

  for (const d of readdirSync(join(tool, 'skills'), { withFileTypes: true })) {
    if (d.isDirectory()) copy(join(tool, 'skills', d.name), join(claude, 'skills', d.name), `skill ${d.name}`);
  }
  // agents exactly as Orbito ships them (the same for everyone in the team); personal model modes never touch them
  for (const f of readdirSync(join(tool, 'agents'))) {
    if (f.endsWith('.md')) copy(join(tool, 'agents', f), join(claude, 'agents', f), `agent ${f.replace(/\.md$/, '')}`);
  }
  // the two model profiles belong to Orbito; the settings that pick one (team and personal) are never touched
  copy(join(tool, 'agents', 'models.json'), join(root, PROFILES), 'model profiles');
  // personal files stay out of the team's repository
  const ignore = join(root, '.gitignore');

  if (existsSync(ignore)) {
    const text = readFileSync(ignore, 'utf8');
    const missing = PERSONAL_FILES.filter((p) => !text.split(/\r?\n/).includes(p));

    if (missing.length) {
      writeFileSync(ignore, `${text.replace(/\s*$/, '\n')}\n# personal: each person's own Orbito settings and feedback notes\n${missing.join('\n')}\n`);
      result.added.push(`.gitignore: ${missing.join(', ')}`);
    }
  }
  const commands = join(tool, 'templates/base/.claude/commands');

  if (existsSync(commands)) {
    for (const f of readdirSync(commands)) copy(join(commands, f), join(claude, 'commands', f), `command /${f.replace(/\.md$/, '')}`);
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
  for (const name of RETIRED_SKILLS) {
    const dir = join(claude, 'skills', name);

    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      result.removed.push(`skill ${name}`);
    }
  }

  for (const name of RETIRED_AGENTS) {
    const file = join(claude, 'agents', `${name}.md`);

    if (existsSync(file)) {
      rmSync(file);
      result.removed.push(`agent ${name}`);
    }
  }

  return result;
};
