import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { saveStatus } from '../status.mjs';

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'orbito-status-'));
  file = join(dir, '.orbito/status.json');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const read = () => JSON.parse(readFileSync(file, 'utf8'));

describe('saveStatus', () => {
  it('creates the file and keeps the other entries, sorted', () => {
    saveStatus(file, { id: 'flow:b/x', status: 'wip' }, '2026-11-01');
    const saved = saveStatus(file, { id: 'flow:a/x', status: 'approved', note: ' ok ' }, '2026-11-01');

    expect(saved).toEqual({ status: 'approved', note: 'ok', updatedAt: '2026-11-01' });
    expect(Object.keys(read())).toEqual(['flow:a/x', 'flow:b/x']);
  });

  it('refuses to save over a file it cannot read, and leaves that file as it was', () => {
    saveStatus(file, { id: 'flow:a/x', status: 'wip' }, '2026-11-01');
    const broken = '<<<<<<< HEAD\n{ "flow:a/x": { "status": "wip" } }\n=======\n{}\n>>>>>>> other\n';

    writeFileSync(file, broken);

    expect(() => saveStatus(file, { id: 'flow:b/x', status: 'approved' }, '2026-11-01')).toThrow(/cannot be read/);
    expect(readFileSync(file, 'utf8')).toBe(broken);
  });

  it('rejects an unknown status and a strange id without touching the file', () => {
    expect(() => saveStatus(file, { id: 'flow:a/x', status: 'done' }, '2026-11-01')).toThrow(/status must be one of/);
    expect(() => saveStatus(file, { id: '../x y', status: 'wip' }, '2026-11-01')).toThrow(/invalid status id/);
    expect(existsSync(file)).toBe(false);
  });
});
