#!/usr/bin/env node
/**
 * node orbito/packages/create/src/index.ts <folder> [--title "My product"] [--platform mobile|web|both] [--locale <language of the product, e.g. en, pl>] [--no-install]
 *
 * The technical start of a project: copies the template (base design-system kit, conventions, CLAUDE.md, process file),
 * fills in the name, platform and language, installs and checks it. No design questions: those belong to the project
 * kickoff in Claude Code (`/orbito-init`). Every option has a flag, so an agent can run it without prompts.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { installTeam } from '@uncool-pro/orbito-cli/install';

const here = dirname(fileURLToPath(import.meta.url));
const TOOL = resolve(here, '../../..');
const TEMPLATE = join(TOOL, 'templates/base');
const PACKAGES = resolve(here, '../..');
const PD_PACKAGES = ['cli', 'core', 'runtime', 'viewer', 'vite-plugin'];
// inside the Orbito image: the engine stays in the image, the project gets no packages of its own
const DOCKER = !!process.env.ORBITO_CONTAINER;
const PLATFORMS = { mobile: 'mobile', web: 'desktop', both: 'mobile' } as const;

type Platform = keyof typeof PLATFORMS;

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);

  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name: string) => args.includes(`--${name}`);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1]!.startsWith('--') && args[i - 1] !== '--no-install'));

const fail = (msg: string): never => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const ask = async (question: string, fallback: string): Promise<string> => {
  if (!process.stdin.isTTY) return fallback;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} (${fallback}): `)).trim();

  rl.close();

  return answer || fallback;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mockups';

const main = async () => {
  if (!existsSync(TEMPLATE)) fail('template not found next to the package');
  const dirArg = positional[0] ?? (await ask('Project folder', 'my-mockups'));
  const target = resolve(dirArg);

  if (existsSync(target) && readdirSync(target).length) fail(`${target} is not empty. Choose a new folder.`);
  const title = opt('title') ?? (await ask('Product name', basename(target)));
  const platform = (opt('platform') ?? (await ask('Platform: mobile, web or both', 'mobile'))) as Platform;
  const locale = opt('locale') ?? (await ask('Language of the product (the mockups are written in it), e.g. en, pl, de', 'en'));

  if (!(platform in PLATFORMS)) fail(`--platform must be mobile, web or both (got "${platform}")`);
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(locale)) fail(`--locale must be a language tag such as en, pl or pt-BR (got "${locale}")`);

  console.log(`\nCreating ${title} in ${target}`);
  cpSync(TEMPLATE, target, { recursive: true, filter: (src) => !/[\\/](node_modules|dist)([\\/]|$)/.test(src) });
  if (existsSync(join(target, 'gitignore'))) renameSync(join(target, 'gitignore'), join(target, '.gitignore'));

  const fill = (file: string, map: Record<string, string>) => {
    const p = join(target, file);

    if (!existsSync(p)) return;
    let text = readFileSync(p, 'utf8');

    Object.entries(map).forEach(([k, v]) => (text = text.split(k).join(v)));
    writeFileSync(p, text);
  };
  const platforms = platform === 'both' ? 'mobile + web' : platform;

  const version = (JSON.parse(readFileSync(join(PACKAGES, '../package.json'), 'utf8')) as { version?: string }).version ?? 'latest';

  const values = { '{{title}}': title, '{{viewport}}': platforms, '{{date}}': new Date().toISOString().slice(0, 10), '{{version}}': version };

  ['CLAUDE.md', 'README.md', '.orbito/process.md', 'compose.yaml'].forEach((f) => fill(f, values));
  // the name is the person's text: in a page it goes in as text, in code as a string, whatever characters it has
  fill('index.html', { ...values, '{{title}}': title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') });
  writeFileSync(join(target, '.orbito', 'runtime'), DOCKER ? 'docker\n' : 'local\n');
  if (!DOCKER) rmSync(join(target, 'compose.yaml'), { force: true });
  // what Orbito installed is recorded from the first moment: later updates must be able to tell the person's own items from Orbito's
  installTeam({ root: target, tool: TOOL });
  fill('orbito.config.ts', { "title: 'My product'": `title: ${JSON.stringify(title)}`, "locale: 'en'": `locale: '${locale}'`, "defaultViewport: 'mobile'": `defaultViewport: '${PLATFORMS[platform]}'` });

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  pkg.name = slug(basename(target));
  // the tool's packages are linked from the Orbito folder, never downloaded: nothing with these names comes from the npm
  // registry. In Docker the engine stays in the image, so the project lists none of them: an `npm install` run there by
  // mistake has nothing of Orbito's to look for.
  PD_PACKAGES.forEach((p) => {
    if (DOCKER) delete pkg.dependencies[`@uncool-pro/orbito-${p}`];
    else pkg.dependencies[`@uncool-pro/orbito-${p}`] = `file:${relative(target, join(PACKAGES, p)).split('\\').join('/')}`;
  });
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  if (!flag('no-install') && !DOCKER) {
    console.log('Installing…');
    execSync('npm install --no-audit --no-fund', { cwd: target, stdio: 'inherit' });
    execSync('npm run check:ds', { cwd: target, stdio: 'inherit' });
  }

  console.log(`
✓ Ready: ${title}

  cd ${relative(process.cwd(), target) || '.'}
  raw/                 put everything you have here first (old site, brand, texts, notes), unsorted
  ${DOCKER ? 'docker compose up -d' : 'npm run dev         '} board http://localhost:5190 · design system #/ds
  claude               then /orbito-init: Orbito sorts raw/ and kicks off the project

The design process lives in .orbito/process.md; the rules for Claude in CLAUDE.md.
`);
};

await main();
