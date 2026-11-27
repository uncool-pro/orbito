/**
 * Released versions of Orbito are git tags (`v0.9.70`, betas `v0.9.70-beta.1`), made only by the release workflow
 * after CI passed. Updating from the code moves the Orbito folder to one of them, never to the tip of `main`:
 *   - by default the newest stable version,
 *   - with `beta`, the newest version including betas (for trying a release before it is stable),
 *   - or a version named exactly (also an older one, to go back).
 */
import { execFileSync } from 'node:child_process';

const git = (cwd: string, args: string[]) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

export type Channel = { beta?: boolean; version?: string };

const TAG = /^v(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

/** Sort key: a stable version comes after all its betas. */
const key = (tag: string): number[] | undefined => {
  const m = TAG.exec(tag);
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? Number.MAX_SAFE_INTEGER : Number(m[4])];
};

const newer = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
};

/** The release tag to move to, or an error that says what exists. */
export function pickRelease(tags: string[], { beta, version }: Channel): string {
  const released = tags.filter((t) => key(t));
  if (version) {
    const wanted = version.startsWith('v') ? version : `v${version}`;
    if (released.includes(wanted)) return wanted;
    throw new Error(`there is no released version ${version.replace(/^v/, '')}; released: ${released.join(', ')}`);
  }
  const candidates = released.filter((t) => beta || !t.includes('-beta.'));
  const best = candidates.sort((a, b) => newer(key(b) as number[], key(a) as number[]))[0];
  if (!best) throw new Error(`no ${beta ? '' : 'stable '}version of Orbito has been released yet`);
  return best;
}

/**
 * Fetches the release tags and moves the Orbito folder to the chosen one (a detached checkout). Refuses when the
 * folder has changes of its own, which a checkout could lose. Returns the commit before and after.
 */
export function moveToRelease(tool: string, channel: Channel): { before: string; after: string; tag: string } {
  if (git(tool, ['status', '--porcelain', '--untracked-files=no'])) {
    throw new Error(
      `the Orbito folder has changes of its own (${tool}), so it is not moved to another version; ` +
        'if you changed Orbito on purpose, commit or stash it first, otherwise `git checkout .` there',
    );
  }
  const before = git(tool, ['rev-parse', 'HEAD']);
  git(tool, ['fetch', '--quiet', '--tags', 'origin']);
  const tag = pickRelease(git(tool, ['tag', '--list', 'v*']).split('\n').filter(Boolean), channel);
  git(tool, ['-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', `refs/tags/${tag}`]);
  return { before, after: git(tool, ['rev-parse', 'HEAD']), tag };
}
