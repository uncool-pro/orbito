/**
 * The two rules every pull request keeps, checked in CI (`.github/workflows/pull-request.yml`), runnable by hand:
 *   node scripts/ci/pull-request.ts <base-sha> <head-sha> [labels as JSON]
 *
 * 1. Every commit is signed off by its author (DCO, see CONTRIBUTING.md). Merge commits are skipped.
 * 2. A change people notice has a line under `## Unreleased` in CHANGELOG.md: a pull request that touches the tool's
 *    code, skills, agents, template or image without changing the changelog fails, unless it carries the label
 *    `no-changelog`.
 *
 * git runs with fixed arguments; the shas come from the pull request event, never from its text.
 */
import { execFileSync } from 'node:child_process';

const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();

/** Paths whose change people notice: they reach a project, the image or what Claude is told. */
export const NOTICED = [/^packages\//, /^skills\//, /^agents\//, /^templates\//, /^docker\//, /^Dockerfile$/];

export function missingSignOff(commits: { sha: string; author: string; body: string }[]): string[] {
  return commits
    .filter((c) => !c.body.split('\n').some((line) => line.trim() === `Signed-off-by: ${c.author}`))
    .map((c) => `${c.sha.slice(0, 7)} (${c.author})`);
}

export function needsChangelog(files: string[], labels: string[]): boolean {
  if (labels.includes('no-changelog')) return false;
  return files.some((f) => NOTICED.some((re) => re.test(f))) && !files.includes('CHANGELOG.md');
}

if (/[\\/]scripts[\\/]ci[\\/]pull-request\.ts$/.test(process.argv[1] ?? '')) {
  const [base, head, labelsJson = '[]'] = process.argv.slice(2);
  if (!/^[0-9a-f]{40}$/.test(base ?? '') || !/^[0-9a-f]{40}$/.test(head ?? '')) {
    console.error('usage: node scripts/ci/pull-request.ts <base-sha> <head-sha> [labels as JSON]');
    process.exit(2);
  }
  const labels: string[] = JSON.parse(labelsJson);
  const range = `${base}..${head}`;
  const commits = git(['rev-list', '--no-merges', range])
    .split('\n')
    .filter(Boolean)
    .map((sha) => ({
      sha,
      author: git(['log', '-1', '--format=%an <%ae>', sha]),
      body: git(['log', '-1', '--format=%B', sha]),
    }));
  const files = git(['diff', '--name-only', `${base}...${head}`])
    .split('\n')
    .filter(Boolean);

  let failed = false;
  const unsigned = missingSignOff(commits);
  if (unsigned.length) {
    failed = true;
    console.error(
      `Commits without a sign-off matching their author (DCO):\n  ${unsigned.join('\n  ')}\n` +
        'Add it with `git commit --amend -s` (last commit) or `git rebase --signoff <base>`, then push again.',
    );
  } else console.log(`DCO: ${commits.length} commit(s), all signed off.`);

  if (needsChangelog(files, labels)) {
    failed = true;
    console.error(
      'This pull request changes what people get (packages, skills, agents, template or image) but not CHANGELOG.md.\n' +
        'Add a line under `## Unreleased`, or ask the maintainer for the label `no-changelog`.',
    );
  } else console.log('Changelog: fine.');

  process.exit(failed ? 1 : 0);
}
