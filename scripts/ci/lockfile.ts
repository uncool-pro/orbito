/**
 * Every package in package-lock.json carries its checksum (`integrity`) and where it came from (`resolved`), so
 * `npm ci` verifies that it got exactly the package that was checked. Workspace links have neither and are skipped.
 * Run in CI (`.github/workflows/ci.yml`, job `audit`); by hand: node scripts/ci/lockfile.ts
 * To fix a lockfile that fails: delete it and node_modules, then `npm install` (versions follow `.npmrc`).
 */
import { readFileSync } from 'node:fs';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
  packages: Record<string, { link?: boolean; integrity?: string; resolved?: string }>;
};

const missing = Object.entries(lock.packages)
  .filter(([path, p]) => path.includes('node_modules/') && !p.link && (!p.integrity || !p.resolved))
  .map(([path]) => path);

if (missing.length) {
  console.error(
    `package-lock.json: ${missing.length} package(s) without a checksum or source:\n  ${missing.join('\n  ')}`,
  );
  console.error('Delete package-lock.json and node_modules, run `npm install`, and commit the new lockfile.');
  process.exit(1);
}
console.log('package-lock.json: every package has its checksum and source.');
