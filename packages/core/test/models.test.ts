import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { modelFor, resolveMode, skillModels } from '../src';
import type { ModelProfiles } from '../src';

const profiles: ModelProfiles = {
  optimal: { 'ui-designer': { model: 'sonnet', effort: 'medium' }, 'ui-designer/look-and-feel': { model: 'opus', effort: 'medium' } },
  high: { 'ui-designer': { model: 'opus', effort: 'medium' } },
};

describe('models', () => {
  it('resolves the mode per person: environment, then personal, then team, then optimal', () => {
    expect(resolveMode({ env: 'high', local: { models: 'optimal' }, team: { models: 'optimal' } })).toEqual({ mode: 'high', source: 'env' });
    expect(resolveMode({ local: { models: 'high' }, team: { models: 'optimal' } })).toEqual({ mode: 'high', source: 'local' });
    expect(resolveMode({ env: 'nonsense', team: { models: 'high' } })).toEqual({ mode: 'high', source: 'team' });
    expect(resolveMode({})).toEqual({ mode: 'optimal', source: 'default' });
  });

  it('reads a role from the profile of a mode; unknown roles have none', () => {
    expect(modelFor(profiles, 'high', 'ui-designer')).toEqual({ model: 'opus', effort: 'medium' });
    expect(modelFor(profiles, 'optimal', 'ui-designer')).toEqual({ model: 'sonnet', effort: 'medium' });
    expect(modelFor(profiles, 'high', 'my-agent')).toBeUndefined();
  });

  it('gives a competence its own model when the profile has one, else the role one', () => {
    expect(modelFor(profiles, 'optimal', 'ui-designer', 'look-and-feel')).toEqual({ model: 'opus', effort: 'medium' });
    expect(modelFor(profiles, 'optimal', 'ui-designer', 'ui-audit')).toEqual({ model: 'sonnet', effort: 'medium' });
    expect(skillModels(profiles, 'optimal', 'ui-designer')).toEqual({ 'look-and-feel': { model: 'opus', effort: 'medium' } });
    expect(skillModels(profiles, 'optimal', 'ux-designer')).toEqual({});
  });
});

describe('the profiles Orbito ships (agents/models.json)', () => {
  const shipped = JSON.parse(readFileSync(new URL('../../../agents/models.json', import.meta.url), 'utf8')) as ModelProfiles;
  const EFFORT = ['low', 'medium', 'high', 'xhigh', 'max'];
  const atLeast = (c: { model: string; effort?: string }, model: string, effort: string) =>
    (c.model === 'opus' || c.model === model) && EFFORT.indexOf(c.effort ?? 'medium') >= EFFORT.indexOf(effort);

  it('never go below Sonnet with high effort', () => {
    Object.values(shipped).forEach((profile) => Object.values(profile).forEach((c) => expect(c.model === 'opus' || atLeast(c, 'sonnet', 'high')).toBe(true)));
  });

  it('run the strategic work on Opus with high effort, very high in the high mode', () => {
    ['orbito', 'ux-designer', 'ui-designer/look-and-feel', 'business-analyst/value-proposition'].forEach((role) => {
      expect(shipped.optimal[role]).toMatchObject({ model: 'opus', effort: 'high' });
      expect(shipped.high[role]).toMatchObject({ model: 'opus', effort: 'xhigh' });
    });
  });
});
