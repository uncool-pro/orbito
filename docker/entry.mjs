// The one command of the image: `docker compose run --rm tools check ds`, `... typecheck`, `docker run ... update`.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROJECT = process.env.ORBITO_PROJECT ?? '/project';
const tool = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const [command = 'serve', ...rest] = process.argv.slice(2);

const run = (args, cwd = PROJECT) => {
  const r = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });

  process.exit(r.status ?? 1);
};

switch (command) {
  case 'serve':
    await import('./serve.mjs');
    break;
  case 'gate':
    await import('./gate.mjs');
    break;
  case 'check':
  case 'export':
  case 'models':
  case 'update':
    run([tool('packages/cli/src/bin.ts'), command, ...rest]);
    break;
  case 'typecheck':
    run([tool('node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', ...rest]);
    break;
  case 'create':
    run([tool('packages/create/src/index.ts'), ...rest], process.cwd());
    break;
  default:
    console.error(`unknown command "${command}": use serve, check, export, models, update, typecheck or create`);
    process.exit(1);
}
