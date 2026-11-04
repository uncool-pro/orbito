import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fingerprint, MANIFEST, updateProject } from '../src/update';

let base: string;
let tool: string;
let root: string;

const put = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const read = (path: string) => readFileSync(path, 'utf8');
const run = () => updateProject({ root, tool, install: false, today: '2026-10-26' });

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'orbito-update-'));
  tool = join(base, 'orbito');
  root = join(base, 'project');
  put(join(tool, 'package.json'), '{ "version": "0.9.4" }');
  put(join(tool, 'skills/wireframes/SKILL.md'), 'wireframes v1');
  put(join(tool, 'agents/ux-designer.md'), 'ux v1');
  put(join(tool, 'agents/models.json'), '{}');
  put(join(root, 'package.json'), '{ "scripts": { "update": "orbito update --pull" } }');
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('orbito update', () => {
  it('lets the version it just pulled finish the update, so new migrations work on the first run', () => {
    const remote = join(base, 'remote');
    const g = (cwd: string, ...args: string[]) => execFileSync('git', ['-C', cwd, ...args], { stdio: 'pipe', encoding: 'utf8' });

    put(join(remote, 'package.json'), '{ "version": "0.9.4" }');
    put(join(remote, 'skills/wireframes/SKILL.md'), 'wireframes');
    put(join(remote, 'agents/models.json'), '{}');
    mkdirSync(join(base, 'empty'));
    g(remote, 'init', '-q', '-b', 'main');
    g(remote, 'config', 'user.email', 'test@example.com');
    g(remote, 'config', 'user.name', 'Test');
    g(remote, 'add', '-A');
    g(remote, 'commit', '-q', '-m', 'first');
    const clone = join(base, 'clone');

    g(base, 'clone', '-q', remote, clone);
    // the next version knows something the running code does not
    put(join(remote, 'package.json'), '{ "version": "0.9.5" }');
    put(join(remote, 'packages/cli/src/bin.ts'), "process.stdout.write(JSON.stringify({ added: ['done by the new version'], updated: [], removed: [], conflicts: [], backedUp: [] }));");
    g(remote, 'add', '-A');
    g(remote, 'commit', '-q', '-m', 'second');

    const r = updateProject({ root, tool: clone, pull: true, install: false });

    expect(r.added).toEqual(['done by the new version']);
    expect(r.tool.to).toContain('0.9.5');
    expect(r.tool.commits).toEqual(['second']);
  });

  it('installs Orbito items and lists them in the manifest', () => {
    const r = run();

    expect(r.added).toEqual(expect.arrayContaining(['skill wireframes', 'agent ux-designer']));
    expect(read(join(root, '.claude/skills/wireframes/SKILL.md'))).toBe('wireframes v1');
    expect(Object.keys(JSON.parse(read(join(root, MANIFEST))).items)).toEqual(expect.arrayContaining(['.claude/skills/wireframes', '.claude/agents/ux-designer.md']));
  });

  it('updates an untouched Orbito skill without a backup', () => {
    run();
    put(join(tool, 'skills/wireframes/SKILL.md'), 'wireframes v2');
    const r = run();

    expect(r.updated).toContain('skill wireframes');
    expect(r.backedUp).toEqual([]);
    expect(read(join(root, '.claude/skills/wireframes/SKILL.md'))).toBe('wireframes v2');
  });

  it('saves an Orbito skill edited in the project before replacing it', () => {
    run();
    put(join(root, '.claude/skills/wireframes/SKILL.md'), 'wireframes v1 + my rule');
    put(join(tool, 'skills/wireframes/SKILL.md'), 'wireframes v2');
    const r = run();

    expect(read(join(root, '.claude/skills/wireframes/SKILL.md'))).toBe('wireframes v2');
    expect(r.backedUp).toEqual(['.orbito/backup/2026-10-26/.claude/skills/wireframes']);
    expect(read(join(root, '.orbito/backup/2026-10-26/.claude/skills/wireframes/SKILL.md'))).toBe('wireframes v1 + my rule');
  });

  it("never overwrites the person's own skill that has a name Orbito starts using", () => {
    run();
    put(join(root, '.claude/skills/brand-rules/SKILL.md'), 'mine');
    put(join(tool, 'skills/brand-rules/SKILL.md'), "Orbito's");
    const r = run();

    expect(r.conflicts).toEqual(['skill brand-rules']);
    expect(read(join(root, '.claude/skills/brand-rules/SKILL.md'))).toBe('mine');
  });

  it("leaves the person's own skills alone and removes a retired skill only if Orbito installed it", () => {
    run();
    // an older Orbito installed ux-design (it is in the manifest), the person added two skills of their own
    const old = join(root, '.claude/skills/ux-design');

    put(join(old, 'SKILL.md'), 'old');
    const manifest = JSON.parse(read(join(root, MANIFEST)));

    manifest.items['.claude/skills/ux-design'] = fingerprint(old);
    put(join(root, MANIFEST), JSON.stringify(manifest));
    put(join(root, '.claude/skills/my-checklist/SKILL.md'), 'mine');
    put(join(root, '.claude/skills/sales-copy/SKILL.md'), 'mine too, same name as a retired one');
    const r = run();

    expect(r.removed).toEqual(['skill ux-design']);
    expect(existsSync(join(root, '.claude/skills/my-checklist'))).toBe(true);
    expect(existsSync(join(root, '.claude/skills/sales-copy'))).toBe(true);
  });

  it('saves a copy of a skill with a retired name in a project without a manifest', () => {
    put(join(root, '.claude/skills/landing-page/SKILL.md'), 'mine');
    const r = run();

    expect(r.backedUp).toEqual(['.orbito/backup/2026-10-26/.claude/skills/landing-page']);
    expect(read(join(root, '.orbito/backup/2026-10-26/.claude/skills/landing-page/SKILL.md'))).toBe('mine');
  });

  it('adds compose.yaml only to a project that runs in a container', () => {
    put(join(tool, 'templates/base/compose.yaml'), 'image: orbito:{{version}}');
    run();
    expect(existsSync(join(root, 'compose.yaml'))).toBe(false);

    put(join(root, '.orbito/runtime'), 'docker\n');
    run();
    expect(read(join(root, 'compose.yaml'))).toBe('image: orbito:0.9.4');
  });
});

describe('a project made by create', () => {
  const create = fileURLToPath(new URL('../../create/src/index.ts', import.meta.url));
  const make = () => {
    const target = join(base, 'made');

    execFileSync(process.execPath, [create, target, '--title', 'T', '--platform', 'web', '--locale', 'en', '--no-install'], { stdio: 'ignore' });

    return target;
  };

  it("has a manifest from the start, so the first update leaves the person's skill alone", () => {
    const target = make();

    expect(Object.keys(JSON.parse(read(join(target, MANIFEST))).items)).toContain('.claude/skills/wireframes');
    put(join(target, '.claude/skills/landing-page/SKILL.md'), 'mine');
    const r = updateProject({ root: target, install: false });

    expect(r.removed).toEqual([]);
    expect(read(join(target, '.claude/skills/landing-page/SKILL.md'))).toBe('mine');
  });

  it('has no compose.yaml when it runs without a container', () => {
    expect(existsSync(join(make(), 'compose.yaml'))).toBe(false);
  });

  it('the first update changes nothing and saves no copies', () => {
    const r = updateProject({ root: make(), install: false });

    expect([r.added, r.updated, r.removed, r.conflicts, r.backedUp]).toEqual([[], [], [], [], []]);
  });
});
