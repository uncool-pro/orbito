import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { exportSite } from '../src/export';

// inside the repository, so the fixture resolves react, vite and the runtime like a real project does
const root = join(dirname(fileURLToPath(import.meta.url)), '.tmp-export');

const files: Record<string, string> = {
  'orbito.config.ts': `export default { title: 'Fixture', locale: 'pl', site: { screen: 'landing', title: 'Week planner', description: 'Plan your week & more.' } };`,
  'design-system/tokens.json': JSON.stringify({ color: [{ name: 'color-bg', value: '#ffffff', usage: 'Background.' }] }),
  'design-system/fonts.css': `@font-face { font-family: 'Brand'; src: url('./fonts/brand.woff2') format('woff2'); }`,
  'public/fonts/brand.woff2': 'not a real font',
  'screens/landing.screen.tsx': `
import { Link, PageScreen } from '@uncool-pro/orbito-runtime';
export const meta = { code: 'LP-01', title: 'Landing', viewport: 'desktop' };
export default function Landing() {
  return (
    <PageScreen>
      <section id="pricing"><h1>Plan</h1></section>
      <Link href="#pricing">See pricing</Link>
      <Link href="https://example.com/buy">Buy</Link>
      <Link to="other">Other screen</Link>
    </PageScreen>
  );
}`,
};

let html = '';

beforeAll(async () => {
  rmSync(root, { recursive: true, force: true });
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  await exportSite({ root });
  html = readFileSync(join(root, 'site/index.html'), 'utf8');
}, 60_000);

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('orbito export', () => {
  it('writes a complete page from site config', () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<html lang="pl">');
    expect(html).toContain('<title>Week planner</title>');
    expect(html).toContain('<meta name="description" content="Plan your week &amp; more." />');
    expect(html).toContain('--color-bg: #ffffff;');
    expect(html).toContain("font-family: 'Brand'");
  });

  it('keeps real links, drops links to other screens and every tool attribute', () => {
    expect(html).toContain('href="#pricing"');
    expect(html).toContain('href="https://example.com/buy"');
    expect(html).toContain('<button type="button">Other screen</button>');
    expect(html).not.toMatch(/data-pd-/);
  });

  it('spans the window and copies public files', () => {
    expect(html).toContain('width:100%');
    expect(existsSync(join(root, 'site/fonts/brand.woff2'))).toBe(true);
  });

  it('refuses an output folder outside the project', async () => {
    await expect(exportSite({ root, out: '../elsewhere' })).rejects.toThrow(/inside the project/);
  });
});
