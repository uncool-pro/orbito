// Measures the board of a project in Chrome: how long until it is ready, and what moving around it costs.
//
//   node scripts/perf/measure.ts [--project .tmp-perf/big] [--page big-0] [--label before] [--headed]
//
// Starts the project's dev server, opens the page in the Chrome on this computer and plays the same camera route every
// time: the whole board at once, panning with pauses, zooming out, panning far out, zooming in, then the pointer over
// the cards. The input goes
// through the browser (DevTools Protocol), like a mouse wheel, not as events made up in the page. Prints the numbers
// and saves them to `.tmp-perf/results/<label>.json` to compare a change with what came before it.
//
// What the numbers mean: `ready` is the time until the arrows are drawn, `complete` until every screen of the project
// has been probed for its links; `script`,
// `style`, `layout` and `paint` are the main thread's time during the route; `frames` are the gaps between two frames
// the page saw (a gap over 50 ms is a stutter you notice). Headless Chrome paints in software, so compare runs with
// each other, never with a person's computer.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { values } = parseArgs({
  options: {
    project: { type: 'string', default: '.tmp-perf/big' },
    page: { type: 'string', default: 'big-0' },
    label: { type: 'string', default: 'run' },
    port: { type: 'string', default: '5299' },
    headed: { type: 'boolean', default: false },
    // the busiest kinds of work in one part of the route, to see what the time goes to
    dump: { type: 'string' },
  },
});
const port = Number(values.port);
const base = `http://localhost:${port}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const startServer = async () => {
  const cwd = resolve(repo, values.project);
  const args = ['vite', '--port', String(port), '--strictPort'];
  const server =
    process.platform === 'win32'
      ? spawn(`npx ${args.join(' ')}`, { cwd, shell: true, stdio: 'ignore' })
      : spawn('npx', args, { cwd, stdio: 'ignore', detached: true });

  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base)).ok) return server;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error(`the dev server did not start on ${base}`);
};

const stopServer = (server: ReturnType<typeof spawn>) => {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' });
  else if (server.pid) process.kill(-server.pid);
};

/** The same route every time, in three parts measured on their own. */
const phases = (page: Page): [string, () => Promise<void>][] => {
  const { width, height } = page.viewportSize()!;
  const wheel = async (dx: number, dy: number, n: number, every = 16) => {
    for (let i = 0; i < n; i++) {
      await page.mouse.wheel(dx, dy);
      await sleep(every);
    }
  };
  const zoom = async (dy: number) => {
    await page.keyboard.down('Control');
    await wheel(0, dy, 12, 30);
    await page.keyboard.up('Control');
    await sleep(250);
  };

  return [
    // the whole board at once (Shift+1) right after opening: every card comes into view in one step, and back
    [
      'fit',
      async () => {
        await page.mouse.move(width / 2, height / 2);
        await page.keyboard.press('Shift+Digit1');
        await sleep(1500);
        await page.keyboard.press('Shift+Digit0');
        await sleep(500);
      },
    ],
    // panning with pauses: the board sharpens when the camera stops
    [
      'pan',
      async () => {
        await page.mouse.move(width / 2, height / 2);
        for (let i = 0; i < 4; i++) {
          await wheel(0, 60, 15);
          await sleep(250);
        }
      },
    ],
    // zoom out, pan far at that zoom, zoom back in
    ['zoom out', () => zoom(100)],
    [
      'pan far',
      async () => {
        // out and back the same way, so the next parts happen over the cards again
        await wheel(80, 20, 40);
        await wheel(-80, -20, 40);
        await sleep(250);
      },
    ],
    ['zoom in', () => zoom(-100)],
    // the pointer over the cards: related screens light up, the rest dims
    [
      'hover',
      async () => {
        for (let i = 0; i < 30; i++)
          await page.mouse.move(200 + ((i * 97) % (width - 400)), 150 + ((i * 53) % (height - 300)), { steps: 4 });
        await sleep(250);
      },
    ],
  ];
};

const main = async () => {
  const server = await startServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: !values.headed });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState: { cookies: [], origins: [{ origin: base, localStorage: [{ name: 'pd.welcomed', value: '1' }] }] },
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const errors: string[] = [];

    page.on('pageerror', (e) => errors.push(e.message));
    await cdp.send('Performance.enable');
    const t0 = Date.now();

    await page.goto(`${base}/#/board/${values.page}`);
    await page.locator('.pd-card').first().waitFor({ timeout: 120_000 });
    const firstCard = Date.now() - t0;

    await page.waitForFunction(() => document.querySelectorAll('.pd-edge').length > 0, null, { timeout: 120_000 });
    const ready = Date.now() - t0;

    await page.waitForFunction(() => '__orbito' in window, null, { timeout: 120_000 });
    const complete = Date.now() - t0;

    await sleep(1000);
    const metrics = async () =>
      Object.fromEntries(
        (await cdp.send('Performance.getMetrics')).metrics.map((m: { name: string; value: number }) => [
          m.name,
          m.value,
        ]),
      ) as Record<string, number>;
    const measured: Record<string, Record<string, number>> = {};

    for (const [name, run] of phases(page)) {
      const before = await metrics();

      await page.evaluate(() => {
        const w = window as unknown as { __frames: number[]; __stop: boolean };

        w.__frames = [];
        w.__stop = false;
        const tick = (t: number) => {
          w.__frames.push(t);
          if (!w.__stop) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
      await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
      await run();
      const trace = JSON.parse((await browser.stopTracing()).toString('utf8')) as {
        traceEvents: { name: string; ph: string; dur?: number }[];
      };
      const frames = await page.evaluate(() => {
        const w = window as unknown as { __frames: number[]; __stop: boolean };

        w.__stop = true;
        return w.__frames;
      });
      const after = await metrics();

      if (values.dump === name) {
        const totals = new Map<string, { ms: number; n: number }>();

        for (const e of trace.traceEvents.filter((ev) => ev.ph === 'X')) {
          const t = totals.get(e.name) ?? { ms: 0, n: 0 };

          t.ms += (e.dur ?? 0) / 1000;
          t.n += 1;
          totals.set(e.name, t);
        }
        console.table(
          [...totals]
            .sort((a, b) => b[1].ms - a[1].ms)
            .slice(0, 20)
            .map(([event, t]) => ({ event, ms: Math.round(t.ms), count: t.n })),
        );
      }
      const gaps = frames.slice(1).map((t, i) => t - frames[i]!);
      const sorted = [...gaps].sort((a, b) => a - b);
      const traced = (event: string) =>
        trace.traceEvents.filter((e) => e.name === event && e.ph === 'X').reduce((sum, e) => sum + (e.dur ?? 0), 0) /
        1000;
      const delta = (metric: string) => Math.round(((after[metric] ?? 0) - (before[metric] ?? 0)) * 1000);

      measured[name] = {
        script: delta('ScriptDuration'),
        style: delta('RecalcStyleDuration'),
        layout: delta('LayoutDuration'),
        paint: Math.round(traced('Paint')),
        raster: Math.round(traced('RasterTask')),
        frameP95: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
        frameMax: Math.round(sorted.at(-1) ?? 0),
        stutters: gaps.filter((g) => g > 50).length,
      };
    }
    const end = await metrics();
    const result = {
      label: values.label,
      page: values.page,
      cards: await page.locator('.pd-card').count(),
      liveScreens: await page.locator('.pd-card__inner').count(),
      firstCardMs: firstCard,
      readyMs: ready,
      completeMs: complete,
      domNodes: end.Nodes,
      heapMb: Math.round((end.JSHeapUsedSize ?? 0) / 1e6),
      phases: measured,
      liveAfterRoute: await page.locator('.pd-card__inner').count(),
      errors,
    };

    mkdirSync(join(repo, '.tmp-perf/results'), { recursive: true });
    writeFileSync(join(repo, '.tmp-perf/results', `${values.label}.json`), `${JSON.stringify(result, null, 2)}\n`);
    const { phases: byPhase, errors: _errors, ...overall } = result;

    console.log(overall);
    console.table(byPhase);
    if (errors.length) console.log('page errors:', errors);
  } finally {
    await browser.close();
    stopServer(server);
  }
};

await main();
