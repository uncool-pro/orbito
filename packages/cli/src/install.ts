/**
 * What Orbito owns inside a project: the skills (`.claude/skills/<name>`), the agents (`.claude/agents`) and Orbito's
 * commands (`.claude/commands`). One way to put them there, for a new project and for every update. What Orbito
 * installed is listed in `.orbito/managed.json` with a fingerprint of each item, so it can tell Orbito's items from the
 * person's own:
 * - an item of the person's with a name Orbito uses is never overwritten (reported as a conflict);
 * - an Orbito item edited in the project is saved to `.orbito/backup/<date>/` before it is replaced;
 * - retired Orbito items are removed only if Orbito installed them;
 * - in a project without that list (made before it existed), a retired item is saved the same way before it goes.
 * Uses Node's own modules only: a new project is made before Orbito's packages are installed.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { fingerprint, LOCAL_SETTINGS, MANIFEST, PROFILES } from './manifest.ts';
import type { Manifest } from './manifest.ts';

/** Files that are personal to each person and never shared through git. */
const PERSONAL_FILES = [LOCAL_SETTINGS, 'feedback.md'];

/** Skills renamed or removed in Orbito: deleted from projects so two versions do not compete. */
const RETIRED_SKILLS = ['orbito-lead', 'ux-design', 'requirements', 'rapid-prototyping', 'landing-page', 'sales-copy', 'ux-review'];
/** Agents whose work moved to other roles. */
const RETIRED_AGENTS = ['prototyper', 'copywriter'];

export const toolVersion = (root: string) => {
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

export type InstallResult = {
  added: string[];
  updated: string[];
  removed: string[];
  /** The person's own items with a name Orbito uses: left as they are, Orbito's version not installed. */
  conflicts: string[];
  /** Orbito items edited in the project: the edited copy saved here before the new version replaced it. */
  backedUp: string[];
};

export const installTeam = ({ root, tool, today = new Date().toISOString().slice(0, 10) }: { root: string; tool: string; today?: string }): InstallResult => {
  root = resolve(root);
  const result: InstallResult = { added: [], updated: [], removed: [], conflicts: [], backedUp: [] };
  const manifestFile = join(root, MANIFEST);
  const before: Manifest | null = existsSync(manifestFile) ? (JSON.parse(readFileSync(manifestFile, 'utf8')) as Manifest) : null;
  const after: Manifest = { version: toolVersion(tool), items: {} };
  const rel = (p: string) => p.slice(root.length + 1).split('\\').join('/');
  const backup = (path: string) => {
    const to = join(root, '.orbito', 'backup', today, rel(path));

    mkdirSync(dirname(to), { recursive: true });
    cpSync(path, to, { recursive: true });
    result.backedUp.push(rel(to));
  };
  /** Installs one Orbito item (a skill folder, an agent file, a command file) without losing anything of the person's. */
  const copy = (from: string, to: string, label: string) => {
    const key = rel(to);

    if (existsSync(to)) {
      const known = before?.items[key];

      // a project from before the manifest: an existing item with Orbito's name is taken as Orbito's
      if (before && !known) {
        result.conflicts.push(label);

        return;
      }
      if (!same(from, to) && known && fingerprint(to) !== known) backup(to);
      else if (!same(from, to) && !before) backup(to);
    }
    after.items[key] = fingerprint(from);
    if (same(from, to)) return;
    (existsSync(to) ? result.updated : result.added).push(label);
    rmSync(to, { recursive: true, force: true });
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  };
  /** Removes a retired Orbito item, only if Orbito installed it; a project without the list cannot tell, so a copy is saved first. */
  const retire = (path: string, label: string) => {
    if (!existsSync(path)) return;
    const known = before?.items[rel(path)];

    if (before && !known) return;
    if (!before || fingerprint(path) !== known) backup(path);
    rmSync(path, { recursive: true, force: true });
    result.removed.push(label);
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
  // the container setup, pinned to this version of Orbito, only where it is used; a project moves to a container by running the update from the image
  const composeTemplate = join(tool, 'templates/base/compose.yaml');
  const runtimeFile = join(root, '.orbito', 'runtime');
  const inContainer = !!process.env.ORBITO_CONTAINER || (existsSync(runtimeFile) && readFileSync(runtimeFile, 'utf8').trim() === 'docker');

  if (inContainer && existsSync(composeTemplate)) {
    const dir = mkdtempSync(join(tmpdir(), 'orbito-'));
    const filled = join(dir, 'compose.yaml');

    writeFileSync(filled, readFileSync(composeTemplate, 'utf8').split('{{version}}').join(toolVersion(tool)));
    copy(filled, join(root, 'compose.yaml'), 'compose.yaml');
    rmSync(dir, { recursive: true, force: true });
    // every folder compose.yaml mounts must exist: a missing one would be created by Docker, owned by root on Linux
    for (const folder of ['public', 'src', 'content', 'reviews']) {
      if (existsSync(join(root, folder))) continue;
      mkdirSync(join(root, folder));
      writeFileSync(join(root, folder, '.gitkeep'), '');
    }
    mkdirSync(join(root, 'site'), { recursive: true });
  }
  for (const name of RETIRED_SKILLS) retire(join(claude, 'skills', name), `skill ${name}`);
  for (const name of RETIRED_AGENTS) retire(join(claude, 'agents', `${name}.md`), `agent ${name}`);
  mkdirSync(dirname(manifestFile), { recursive: true });
  writeFileSync(manifestFile, JSON.stringify(after, null, 2) + '\n');

  return result;
};
