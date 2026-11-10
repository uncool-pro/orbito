/**
 * `orbito models [optimal|high] [--team]` — shows or switches how the agents use models (see core `models.ts`).
 * Without `--team` the choice is personal (`.orbito/settings.local.json`, git-ignored); with `--team` it becomes the
 * team's default (`.orbito/settings.json`, committed). Nothing else changes: agent files stay as Orbito ships them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { resolveMode } from '@uncool-pro/orbito-core';
import type { ModelMode, ModelProfiles, ModeSource, OrbitoSettings } from '@uncool-pro/orbito-core';

import { readJson } from './files.ts';
import { LOCAL_SETTINGS, PROFILES } from './manifest.ts';

export { LOCAL_SETTINGS, PROFILES };

export const TEAM_SETTINGS = '.orbito/settings.json';

/** The profiles of the project (`.orbito/models.json`, refreshed by `orbito update`), or the tool's own. */
export const readProfiles = (root: string, toolAgents: string): ModelProfiles | undefined =>
  readJson<ModelProfiles | undefined>(join(root, PROFILES), undefined) ??
  readJson<ModelProfiles | undefined>(join(toolAgents, 'models.json'), undefined);

/** The mode in use for the person running this, and where it comes from. */
export const currentMode = (root: string): { mode: ModelMode; source: ModeSource } =>
  resolveMode({
    env: process.env.ORBITO_MODELS,
    local: readJson<OrbitoSettings>(join(root, LOCAL_SETTINGS), {}),
    team: readJson<OrbitoSettings>(join(root, TEAM_SETTINGS), {}),
  });

/** Saves a mode: personal by default, the team's default with `team`. */
export const saveMode = (root: string, mode: ModelMode, team = false) => {
  const file = join(root, team ? TEAM_SETTINGS : LOCAL_SETTINGS);
  const current = readJson<OrbitoSettings>(file, {});

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ ...current, models: mode }, null, 2) + '\n');
};
