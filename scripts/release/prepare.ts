/**
 * Prepares a release as a pull request. Merging it releases (`.github/workflows/release.yml` tags the merged commit
 * once CI is green, builds, scans, signs and publishes the image, and writes the GitHub Release).
 *   node scripts/release/prepare.ts beta [--minor]     0.9.69 → 0.9.70-beta.1, 0.9.70-beta.1 → 0.9.70-beta.2
 *   node scripts/release/prepare.ts stable [--minor]   0.9.70-beta.2 → 0.9.70, 0.9.69 → 0.9.70
 * `--minor` starts the next minor version instead of the next patch (only from a stable version).
 * A stable release turns `## Unreleased` into the version's section and opens a new empty one; a beta leaves the
 * changelog as it is (its notes are `## Unreleased`). Needs a clean `main` that matches GitHub, and `gh` signed in.
 * The pull request is opened by whoever runs this, so CI runs on it like on any other.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { notes, section } from './notes.ts';

type Channel = 'beta' | 'stable';
const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

export function nextVersion(current: string, channel: Channel, minor = false): string {
  const m = VERSION.exec(current);
  if (!m) throw new Error(`package.json version ${current} is not x.y.z or x.y.z-beta.n`);
  const [major, min, patch, beta] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4]];
  if (beta !== undefined) {
    if (minor) throw new Error(`${current} is a beta: finish it with "stable" before starting a new minor version`);
    return channel === 'beta' ? `${major}.${min}.${patch}-beta.${Number(beta) + 1}` : `${major}.${min}.${patch}`;
  }
  const base = minor ? `${major}.${min + 1}.0` : `${major}.${min}.${patch + 1}`;
  return channel === 'beta' ? `${base}-beta.1` : base;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function stampChangelog(changelog: string, version: string, today: Date): string {
  const date = `${today.getUTCDate()} ${MONTHS[today.getUTCMonth()]} ${today.getUTCFullYear()}`;
  const lines = changelog.split('\n');
  const at = lines.findIndex((l) => l.trim() === '## Unreleased');
  if (at < 0) throw new Error('CHANGELOG.md has no "## Unreleased" section');
  lines.splice(at, 1, '## Unreleased', '', `## ${version} — ${date}`);
  return lines.join('\n');
}

if (/[\\/]scripts[\\/]release[\\/]prepare\.ts$/.test(process.argv[1] ?? '')) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
  const [channel, ...rest] = process.argv.slice(2);
  if (channel !== 'beta' && channel !== 'stable') {
    console.error('usage: node scripts/release/prepare.ts beta|stable [--minor]');
    process.exit(2);
  }
  if (run('git', ['rev-parse', '--abbrev-ref', 'HEAD']) !== 'main') throw new Error('switch to main first');
  if (run('git', ['status', '--porcelain', '--untracked-files=no']))
    throw new Error('commit or stash your changes first');
  run('git', ['fetch', '--quiet', 'origin', 'main']);
  if (run('git', ['rev-parse', 'HEAD']) !== run('git', ['rev-parse', 'origin/main'])) {
    throw new Error('main differs from GitHub: git pull --ff-only first');
  }

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = nextVersion(pkg.version, channel, rest.includes('--minor'));
  let changelog = readFileSync('CHANGELOG.md', 'utf8');
  if (!section(changelog, (l) => l.trim() === '## Unreleased')) {
    throw new Error('nothing to release: "## Unreleased" in CHANGELOG.md is empty');
  }
  if (channel === 'stable') {
    changelog = stampChangelog(changelog, version, new Date());
    writeFileSync('CHANGELOG.md', changelog);
  }
  pkg.version = version;
  writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  lock.version = version;
  lock.packages[''].version = version;
  writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);

  const branch = `release/v${version}`;
  run('git', ['switch', '--quiet', '-c', branch]);
  run('git', ['add', 'package.json', 'package-lock.json', 'CHANGELOG.md']);
  run('git', ['commit', '--quiet', '--signoff', '-m', `Release ${version}`]);
  run('git', ['push', '--quiet', '-u', 'origin', branch]);
  const body = `${notes(changelog, version)}\n\nMerging this releases ${version}: the release workflow tags it once CI is green, then builds, scans, signs and publishes the image and writes the GitHub Release.`;
  const url = run('gh', [
    'pr',
    'create',
    '--base',
    'main',
    '--head',
    branch,
    '--title',
    `Release ${version}`,
    '--body',
    body,
  ]);
  console.log(`Release ${version}: ${url}`);
}
