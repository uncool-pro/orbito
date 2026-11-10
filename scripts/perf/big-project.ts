// A large project to measure the board on: the demo app copied many times over, as one big product.
//
//   node scripts/perf/big-project.ts [--copies 24] [--per-page 3] [--out .tmp-perf/big]
//
// Every copy of a screen gets its own id and code (`plant-list-c07`, `PL-01-c07`) and links to the other screens of
// its copy; copy 0 keeps the original ids, so the shared navigation (tab bars) leads there, as in a real app. The
// flows of `--per-page` copies make one page. The folder is inside the repository so the packages resolve, and
// ignored by git (`.tmp-*/`). Nothing here runs in Orbito itself.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const demo = join(repo, 'demo');
const { values } = parseArgs({
  options: {
    copies: { type: 'string', default: '24' },
    'per-page': { type: 'string', default: '3' },
    out: { type: 'string', default: '.tmp-perf/big' },
  },
});
const copies = Number(values.copies);
const perPage = Number(values['per-page']);
const out = resolve(repo, values.out);

if (!out.startsWith(join(repo, '.tmp-'))) throw new Error('the project goes into a .tmp-* folder of the repository');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const screenFiles = walk(join(demo, 'screens')).filter((f) => f.endsWith('.screen.tsx'));
const ids = screenFiles.map((f) => basename(f, '.screen.tsx'));
const suffix = (c: number) => (c === 0 ? '' : `-c${String(c).padStart(2, '0')}`);
/** Every quoted screen id becomes the id of the same screen in copy `c`. */
const relink = (text: string, c: number) =>
  c === 0
    ? text
    : text.replace(/(['"])([\w-]+)\1/g, (m, q, id) => (ids.includes(id) ? `${q}${id}${suffix(c)}${q}` : m));

rmSync(out, { recursive: true, force: true });
cpSync(demo, out, {
  recursive: true,
  filter: (src) => !/^(node_modules|dist|comments|flows)([\\/]|$)/.test(relative(demo, src)),
});
for (const f of walk(join(out, 'screens')).filter((f) => f.endsWith('.screen.tsx'))) rmSync(f);

for (let c = 0; c < copies; c++)
  for (const file of screenFiles) {
    const target = join(out, relative(demo, dirname(file)), `${basename(file, '.screen.tsx')}${suffix(c)}.screen.tsx`);
    const code = relink(readFileSync(file, 'utf8'), c).replace(/code: '([^']+)'/, `code: '$1${suffix(c)}'`);

    writeFileSync(target, code);
  }

// the flows of the demo, each copy with its own keys and screens
const flowArrays = readdirSync(join(demo, 'flows')).map((f) => {
  const text = readFileSync(join(demo, 'flows', f), 'utf8');
  const start = text.indexOf('flows: [') + 'flows: ['.length;
  const end = text.lastIndexOf(']');

  return text.slice(start, end).trim().replace(/,$/, '');
});
mkdirSync(join(out, 'flows'), { recursive: true });
for (let p = 0; p * perPage < copies; p++) {
  const parts: string[] = [];

  for (let c = p * perPage; c < Math.min(copies, (p + 1) * perPage); c++)
    for (const flows of flowArrays)
      parts.push(relink(flows, c).replace(/key: '([^']+)'/g, (_m, k) => `key: '${k}${suffix(c) || '-c00'}'`));
  writeFileSync(
    join(out, 'flows', `big-${p}.flow.ts`),
    `import { definePage } from '@uncool-pro/orbito-core';\n\nexport default definePage({\n  key: 'big-${p}',\n  name: 'Big ${p + 1}',\n  flows: [\n${parts.join(',\n')}\n  ],\n});\n`,
  );
}

const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));

pkg.name = 'perf-big';
writeFileSync(join(out, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`${copies * screenFiles.length} screens, ${Math.ceil(copies / perPage)} pages → ${relative(repo, out)}`);
