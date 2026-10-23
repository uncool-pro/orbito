/**
 * `orbito models [optimal|high]` — shows or switches how the team's agents use models (see core `models.ts`).
 * The mode is stored in `.orbito/settings.json`; switching rewrites the `model:` and `effort:` lines of Orbito's
 * agents in `.claude/agents/` (agents the person added themselves keep their settings).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { isModelMode, modelFor, parseFrontmatter, withModel } from '@uncool-pro/orbito-core';
import type { ModelChoice, ModelMode, OrbitoSettings } from '@uncool-pro/orbito-core';

const SETTINGS = '.orbito/settings.json';

export const readSettings = (root: string): OrbitoSettings => {
  try {
    return JSON.parse(readFileSync(join(root, SETTINGS), 'utf8')) as OrbitoSettings;
  } catch {
    return {};
  }
};

export const modelMode = (root: string): ModelMode => {
  const m = readSettings(root).models;

  return isModelMode(m) ? m : 'optimal';
};

/** The optimal settings an agent file of the tool declares. */
const optimalOf = (toolFile: string): ModelChoice | undefined => {
  const { data } = parseFrontmatter(toolFile);

  return data.model ? { model: data.model, effort: data.effort } : undefined;
};

/** An agent file from the tool, with the model and effort of the project's mode. */
export const agentForMode = (toolFile: string, name: string, mode: ModelMode): string => {
  const optimal = optimalOf(toolFile);

  return optimal ? withModel(toolFile, modelFor(name, mode, optimal)) : toolFile;
};

export type ModelsResult = { mode: ModelMode; agents: { name: string; choice: ModelChoice; changed: boolean }[] };

/**
 * Sets the mode (when given) and applies it to Orbito's agents in the project. `toolAgents` is the tool's `agents/`
 * folder: only agents that exist there are Orbito's; their optimal settings are read from it.
 */
export const applyModels = (root: string, toolAgents: string, mode?: ModelMode): ModelsResult => {
  if (mode) {
    const file = join(root, SETTINGS);

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ ...readSettings(root), models: mode }, null, 2) + '\n');
  }
  const active = mode ?? modelMode(root);
  const agents: ModelsResult['agents'] = [];

  for (const f of existsSync(toolAgents) ? readdirSync(toolAgents) : []) {
    const target = join(root, '.claude/agents', f);

    if (!f.endsWith('.md') || !existsSync(target)) continue;
    const name = f.replace(/\.md$/, '');
    const optimal = optimalOf(readFileSync(join(toolAgents, f), 'utf8'));

    if (!optimal) continue;
    const choice = modelFor(name, active, optimal);
    const current = readFileSync(target, 'utf8');
    const next = withModel(current, choice);

    if (next !== current) writeFileSync(target, next);
    agents.push({ name, choice, changed: next !== current });
  }

  return { mode: active, agents };
};
