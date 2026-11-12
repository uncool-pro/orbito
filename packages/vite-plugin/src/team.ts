// The team for the skills map: Orbito's agents and skills, read from their markdown files.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTeam, listOf, modelFor, parseFrontmatter, resolveMode, skillModels } from '@uncool-pro/orbito-core';
import type { AgentSource, ModelProfiles, OrbitoSettings, SkillSource, Team } from '@uncool-pro/orbito-core';

import { readJson } from './files.ts';

// the tool's folder, for telling what ships with Orbito from the project's own items
const TOOL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export type TeamDirs = { skills: string; agents: string };

/** Where the team lives: the project's .claude/ folder, or (in the tool repository, e.g. the demo) the nearest skills/ + agents/ above. */
export const teamDirs = (root: string): TeamDirs | undefined => {
  if (existsSync(resolve(root, '.claude/skills')))
    return { skills: resolve(root, '.claude/skills'), agents: resolve(root, '.claude/agents') };
  for (let dir = root, i = 0; i < 4; i++, dir = dirname(dir)) {
    if (existsSync(resolve(dir, 'skills')) && existsSync(resolve(dir, 'agents')))
      return { skills: resolve(dir, 'skills'), agents: resolve(dir, 'agents') };
  }

  return undefined;
};

/** Reads skills and agents from their markdown files (front matter + the skills each agent's instructions name). */
export const readTeam = (root: string): Team | null => {
  const dirs = teamDirs(root);

  if (!dirs) return null;
  // the project's own items: neither installed by Orbito (`.orbito/managed.json`) nor shipped with it
  const managed = readJson<{ items?: Record<string, string> }>(resolve(root, '.orbito/managed.json'), {}).items ?? {};
  const inProject = dirs.skills === resolve(root, '.claude/skills');
  const ownSkill = (name: string) =>
    inProject && !managed[`.claude/skills/${name}`] && !existsSync(resolve(TOOL_ROOT, 'skills', name));
  const ownAgent = (file: string) =>
    inProject && !managed[`.claude/agents/${file}`] && !existsSync(resolve(TOOL_ROOT, 'agents', file));
  const skills: SkillSource[] = (existsSync(dirs.skills) ? readdirSync(dirs.skills, { withFileTypes: true }) : [])
    .filter((d) => d.isDirectory() && existsSync(resolve(dirs.skills, d.name, 'SKILL.md')))
    .map((d) => {
      const { data, body } = parseFrontmatter(readFileSync(resolve(dirs.skills, d.name, 'SKILL.md'), 'utf8'));

      return { name: data.name || d.name, description: data.description || '', body, own: ownSkill(d.name) };
    });
  const agents: AgentSource[] = (existsSync(dirs.agents) ? readdirSync(dirs.agents) : [])
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, body } = parseFrontmatter(readFileSync(resolve(dirs.agents, f), 'utf8'));

      return {
        name: data.name || f.replace(/\.md$/, ''),
        description: data.description || '',
        model: data.model,
        effort: data.effort,
        skills: listOf(data.skills),
        body,
        own: ownAgent(f),
      };
    });

  // the model mode of the person running the viewer: environment → personal settings → the team's default
  const { mode, source } = resolveMode({
    env: process.env.ORBITO_MODELS,
    local: readJson<OrbitoSettings>(resolve(root, '.orbito/settings.local.json'), {}),
    team: readJson<OrbitoSettings>(resolve(root, '.orbito/settings.json'), {}),
  });
  const profiles =
    readJson<ModelProfiles | undefined>(resolve(root, '.orbito/models.json'), undefined) ??
    readJson<ModelProfiles | undefined>(resolve(dirs.agents, 'models.json'), undefined);
  // each agent as Orbito will call it in this mode (the profile wins over the agent file's own values)
  const inMode = agents.map((a) => ({
    ...a,
    ...(modelFor(profiles, mode, a.name) ?? {}),
    skillModels: skillModels(profiles, mode, a.name),
  }));

  return { ...buildTeam(skills, inMode), models: mode, modelsSource: source };
};
