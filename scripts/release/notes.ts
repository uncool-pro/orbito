/**
 * Release notes for GitHub, from CHANGELOG.md, printed to stdout:
 *   node scripts/release/notes.ts <version> [image digest]
 * A stable version takes its own section (`## 0.9.70 — 4 December 2026`); a beta (0.9.70-beta.1) takes `## Unreleased`,
 * which is what the beta carries. Then how to get it and how to check the image.
 */
import { readFileSync } from 'node:fs';

export function section(changelog: string, heading: (line: string) => boolean): string {
  const lines = changelog.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## ') && heading(l));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join('\n')
    .trim();
}

export function notes(changelog: string, version: string, digest = ''): string {
  const beta = version.includes('-beta.');
  const body = beta
    ? section(changelog, (l) => l.trim() === '## Unreleased')
    : section(changelog, (l) => l === `## ${version}` || l.startsWith(`## ${version} `));
  if (!body) throw new Error(`CHANGELOG.md has no section for ${beta ? 'Unreleased' : version}`);
  const image = `ghcr.io/uncool-pro/orbito:${version}`;
  return [
    beta
      ? `**Beta, for trying out before the stable release.** Projects stay on the stable version unless they ask for this one.\n`
      : '',
    body,
    '',
    '---',
    `**Image:** \`${image}\`${digest ? ` (\`${digest}\`)` : ''}`,
    `Check that this repository's release workflow built it: \`gh attestation verify oci://${image} --owner uncool-pro\``,
  ]
    .filter((l, i) => i > 0 || l)
    .join('\n');
}

if (/[\\/]scripts[\\/]release[\\/]notes\.ts$/.test(process.argv[1] ?? '')) {
  const [version = '', digest] = process.argv.slice(2);
  if (!/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(version)) {
    console.error('usage: node scripts/release/notes.ts <version> [image digest]');
    process.exit(2);
  }
  process.stdout.write(`${notes(readFileSync('CHANGELOG.md', 'utf8'), version, digest)}\n`);
}
