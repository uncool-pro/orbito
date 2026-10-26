import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

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
});
