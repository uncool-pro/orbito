#!/usr/bin/env node
/**
 * npm create orbito <folder> [--title "My product"] [--platform mobile|web|both] [--locale en|pl] [--local] [--no-install]
 *
 * The technical start of a project: copies the template (base design-system kit, conventions, CLAUDE.md, process file),
 * fills in the name, platform and language, installs and checks it. No design questions: those belong to the project
 * kickoff in Claude Code (`/orbito-init`). Every option has a flag, so an agent can run it without prompts.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// in the repository the template sits next to the packages; a published package will carry its own copy
const TEMPLATE = [join(here, '../template'), join(here, '../../../templates/base')].find((p) => existsSync(p));
// the product skills and agents: one source in the repository, copied into every project's .claude/
const SKILLS = [join(here, '../skills'), join(here, '../../../skills')].find((p) => existsSync(p));
const AGENTS = [join(here, '../agents'), join(here, '../../../agents')].find((p) => existsSync(p));
const PACKAGES = resolve(here, '../..');
const PD_PACKAGES = ['cli', 'core', 'runtime', 'viewer', 'vite-plugin'];
const PLATFORMS = { mobile: 'mobile', web: 'desktop', both: 'mobile' } as const;

type Platform = keyof typeof PLATFORMS;

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);

  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name: string) => args.includes(`--${name}`);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1]!.startsWith('--') && !['--local', '--no-install'].includes(args[i - 1]!)));

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
  if (!TEMPLATE) fail('template not found next to the package');
  const dirArg = positional[0] ?? (await ask('Project folder', 'my-mockups'));
  const target = resolve(dirArg);

  if (existsSync(target) && readdirSync(target).length) fail(`${target} is not empty. Choose a new folder.`);
  const title = opt('title') ?? (await ask('Product name', basename(target)));
  const platform = (opt('platform') ?? (await ask('Platform: mobile, web or both', 'mobile'))) as Platform;
  const locale = opt('locale') ?? (await ask('Language of the tool: en or pl', 'en'));

  if (!(platform in PLATFORMS)) fail(`--platform must be mobile, web or both (got "${platform}")`);
  if (!['en', 'pl'].includes(locale)) fail(`--locale must be en or pl (got "${locale}")`);
  // a local checkout of the tool (or an explicit --local) links the packages instead of downloading them
  const local = flag('local') || existsSync(join(PACKAGES, 'core', 'src', 'index.ts'));

  console.log(`\nCreating ${title} in ${target}`);
  cpSync(TEMPLATE!, target, { recursive: true, filter: (src) => !/[\\/](node_modules|dist)([\\/]|$)/.test(src) });
  if (existsSync(join(target, 'gitignore'))) renameSync(join(target, 'gitignore'), join(target, '.gitignore'));
  if (SKILLS) cpSync(SKILLS, join(target, '.claude', 'skills'), { recursive: true, filter: (src) => !/README.md$/.test(src) || statSync(src).isDirectory() });
  if (AGENTS) {
    cpSync(AGENTS, join(target, '.claude', 'agents'), { recursive: true, filter: (src) => !src.endsWith('models.json') });
    // the two model profiles are Orbito's, next to the settings that pick one
    if (existsSync(join(AGENTS, 'models.json'))) cpSync(join(AGENTS, 'models.json'), join(target, '.orbito', 'models.json'));
  }

  const fill = (file: string, map: Record<string, string>) => {
    const p = join(target, file);

    if (!existsSync(p)) return;
    let text = readFileSync(p, 'utf8');

    Object.entries(map).forEach(([k, v]) => (text = text.split(k).join(v)));
    writeFileSync(p, text);
  };
  const platforms = platform === 'both' ? 'mobile + web' : platform;

  ['CLAUDE.md', 'README.md', 'index.html', '.orbito/process.md'].forEach((f) => fill(f, { '{{title}}': title, '{{viewport}}': platforms, '{{date}}': new Date().toISOString().slice(0, 10) }));
  fill('orbito.config.ts', { "title: 'My product'": `title: ${JSON.stringify(title).replace(/^"|"$/g, "'")}`, "locale: 'en'": `locale: '${locale}'`, "defaultViewport: 'mobile'": `defaultViewport: '${PLATFORMS[platform]}'` });

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  pkg.name = slug(basename(target));
  PD_PACKAGES.forEach((p) => {
    pkg.dependencies[`@uncool-pro/orbito-${p}`] = local ? `file:${relative(target, join(PACKAGES, p)).split('\\').join('/')}` : '^0.1.0';
  });
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  if (!flag('no-install')) {
    console.log('Installing…');
    execSync('npm install --no-audit --no-fund', { cwd: target, stdio: 'inherit' });
    execSync('npm run check:ds', { cwd: target, stdio: 'inherit' });
  }

  console.log(`
✓ Ready: ${title}

  cd ${relative(process.cwd(), target) || '.'}
  raw/                 put everything you have here first (old site, brand, texts, notes), unsorted
  npm run dev          board #/board · design system #/ds
  claude               then /orbito-init: Orbito sorts raw/ and kicks off the project

The design process lives in .orbito/process.md; the rules for Claude in CLAUDE.md.
`);
};

await main();
