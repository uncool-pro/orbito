import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { analyzeProject } from '../src/analyze.ts';
import { inside, insideForReal, readJson } from '../src/files.ts';

let base: string;
let root: string;
let outside: string;

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'orbito-files-'));
  root = join(base, 'project');
  outside = join(base, 'outside');
  mkdirSync(join(root, 'screens'), { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(root, 'screens/a.screen.tsx'), 'export default () => null;\nexport const meta = { title: "A" };\n');
  writeFileSync(join(outside, 'b.screen.tsx'), 'export default () => <button />;\n');
  // a junction on Windows (no special rights needed), a symbolic link elsewhere
  symlinkSync(outside, join(root, 'screens/elsewhere'), 'junction');
});

afterEach(() => {
  rmSync(join(root, 'screens/elsewhere'), { recursive: true, force: true });
  rmSync(base, { recursive: true, force: true });
});

describe('inside', () => {
  it('goes by the path: the folder itself and anything above or beside it are outside', () => {
    expect(inside(root, join(root, 'screens/a.screen.tsx'))).toBe(true);
    expect(inside(root, root)).toBe(false);
    expect(inside(root, join(root, '..', 'outside', 'b.screen.tsx'))).toBe(false);
    expect(inside(root, `${root}-other`)).toBe(false);
  });
});

describe('insideForReal', () => {
  it('follows links: a file reached through a link that leaves the folder is outside', () => {
    expect(insideForReal(root, join(root, 'screens/a.screen.tsx'))).toBe(true);
    expect(insideForReal(root, join(root, 'screens/elsewhere/b.screen.tsx'))).toBe(false);
  });

  it('is false for a file that is not there', () => {
    expect(insideForReal(root, join(root, 'screens/missing.tsx'))).toBe(false);
  });
});

describe('readJson', () => {
  it('gives the fallback for a missing or damaged file', () => {
    writeFileSync(join(root, 'ok.json'), '{"a":1}');
    writeFileSync(join(root, 'bad.json'), '<<<<<<< HEAD');
    expect(readJson(join(root, 'ok.json'), {})).toEqual({ a: 1 });
    expect(readJson(join(root, 'bad.json'), { b: 2 })).toEqual({ b: 2 });
    expect(readJson(join(root, 'missing.json'), null)).toBeNull();
  });
});

describe('the design-system check', () => {
  it('reads the screens of the project only, not what a link in screens/ leads to', () => {
    const report = analyzeProject({ root });

    expect(Object.keys(report.screens)).toEqual(['a']);
    expect(report.issues.filter((i) => i.rule === 'raw-interactive')).toEqual([]);
  });
});
