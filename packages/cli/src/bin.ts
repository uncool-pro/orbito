#!/usr/bin/env node
/**
 * orbito — command line of Orbito.
 *
 *   orbito check ds [--json] [--root <dir>] [--strict] [--verbose]   design-system rules; exit 1 on errors (--strict: also on warnings); --verbose also lists info
 *   orbito export [<screen-id>] [--out <dir>] [--root <dir>]          one screen as a static site (default: site.screen from orbito.config.ts)
 *   orbito models [optimal|high] [--team] [--root <dir>]               show or switch how the agents use models, for you (or --team: the team's default)
 *   orbito update [--pull] [--no-install] [--root <dir>]               refresh the project's Orbito skills, agents and commands (--pull: update Orbito from GitHub first)
 */
import { resolve } from 'node:path';

import { analyzeProject } from './analyze.ts';
import { exportSite } from './export.ts';
import type { ModelMode } from '@uncool-pro/orbito-core';

import { currentMode, LOCAL_SETTINGS, readProfiles, saveMode, TEAM_SETTINGS } from './models.ts';
import { toolRoot, updateProject } from './update.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);

  return i >= 0 ? args[i + 1] : undefined;
};

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number, s: string) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);

const checkDs = () => {
  const root = resolve(opt('root') ?? process.cwd());
  const report = analyzeProject({ root });

  if (flag('json')) {
    process.stdout.write(JSON.stringify({ counts: report.counts, issues: report.issues, components: report.components }, null, 2) + '\n');
  } else {
    const mark = { error: paint(31, 'error'), warning: paint(33, 'warn '), info: paint(36, 'info ') };

    report.issues.filter((i) => flag('verbose') || i.severity !== 'info').forEach((i) => {
      const where = i.file ? `${i.file}${i.line ? `:${i.line}` : ''}` : '';

      console.log(`${mark[i.severity]}  ${paint(2, i.rule.padEnd(16))} ${where ? `${where}  ` : ''}${i.message}`);
      if (i.hint) console.log(`       ${paint(2, '→ ' + i.hint)}`);
    });
    const c = report.counts;

    console.log(`\n${report.components.length} components, ${Object.keys(report.screens).length} screens · ${paint(31, `${c.error} errors`)}, ${paint(33, `${c.warning} warnings`)}, ${c.info} info${c.info && !flag('verbose') ? ' (--verbose to list)' : ''}`);
  }
  const fail = report.counts.error > 0 || (flag('strict') && report.counts.warning > 0);

  process.exitCode = fail ? 1 : 0;
};

const exportCmd = async (screen: string | undefined) => {
  try {
    const r = await exportSite({ root: resolve(opt('root') ?? process.cwd()), screen, out: opt('out') });

    console.log(`exported ${r.screen} (${r.file}) → ${r.out}/index.html, ${Math.round(r.bytes / 1024)} kB${r.copied ? `, ${r.copied} files from public/` : ''}`);
  } catch (e) {
    console.error(paint(31, 'export failed: ') + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  }
};

const updateCmd = () => {
  try {
    const r = updateProject({ root: resolve(opt('root') ?? process.cwd()), pull: flag('pull'), install: !flag('no-install') });

    console.log(r.tool.from === r.tool.to ? `Orbito ${r.tool.to}` : `Orbito ${r.tool.from} → ${r.tool.to}`);
    r.tool.commits?.forEach((c) => console.log(`  · ${c}`));
    const changes = [...r.added.map((x) => `+ ${x}`), ...r.updated.map((x) => `~ ${x}`), ...r.removed.map((x) => `- ${x}`)];

    console.log(changes.length ? changes.join('\n') : 'skills, agents and commands are up to date');
    r.conflicts.forEach((x) => console.log(paint(33, `! ${x}: one of yours has this name, so Orbito's was not installed — rename yours and run the update again`)));
    if (r.backedUp.length) console.log(paint(33, `! edits you made to Orbito's items were saved before the update: ${r.backedUp.join(', ')} — put your additions in a skill of your own`));
    console.log(paint(2, 'Your screens, flows and design system were not changed. New template pieces are listed in CHANGELOG.md of Orbito.'));
  } catch (e) {
    console.error(paint(31, 'update failed: ') + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  }
};

const modelsCmd = (mode: string | undefined) => {
  if (mode && mode !== 'optimal' && mode !== 'high') {
    console.error(paint(31, 'models: ') + 'use optimal or high');
    process.exitCode = 1;

    return;
  }
  const root = resolve(opt('root') ?? process.cwd());
  const team = flag('team');

  if (mode) saveMode(root, mode as ModelMode, team);
  const { mode: active, source } = currentMode(root);
  const from = { env: 'ORBITO_MODELS environment variable', local: 'your setting, .orbito/settings.local.json', team: "the team's default, .orbito/settings.json", default: 'default' }[source];

  if (mode) console.log(team ? `saved as the team's default (${TEAM_SETTINGS}, commit it to share)` : `saved for you only (${LOCAL_SETTINGS}, not shared through git)`);
  console.log(`models: ${active} — ${from}`);
  const profile = readProfiles(root, resolve(toolRoot(), 'agents'))?.[active] ?? {};

  Object.entries(profile).forEach(([role, c]) => console.log(`  ${role.padEnd(36)} ${c.model}${c.effort ? ` · ${c.effort}` : ''}`));
  console.log(paint(2, 'Orbito passes these to each agent it calls (role/skill: for that competence); agent files are not changed. Orbito itself runs on the model you pick in Claude Code.'));
};

const [cmd, sub] = args.filter((a) => !a.startsWith('--') && a !== opt('root') && a !== opt('out'));

if (cmd === 'check' && sub === 'ds') checkDs();
else if (cmd === 'export') await exportCmd(sub);
else if (cmd === 'update') updateCmd();
else if (cmd === 'models') modelsCmd(sub);
else {
  console.log('Usage: orbito check ds [--json] [--root <dir>] [--strict] [--verbose]\n       orbito export [<screen-id>] [--out <dir>] [--root <dir>]\n       orbito models [optimal|high] [--team] [--root <dir>]\n       orbito update [--pull] [--no-install] [--root <dir>]');
  process.exitCode = cmd ? 1 : 0;
}
