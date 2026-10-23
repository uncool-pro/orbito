import { describe, expect, it } from 'vitest';

import { modelFor, resolveMode } from '../src';
import type { ModelProfiles } from '../src';

const profiles: ModelProfiles = {
  optimal: { 'ui-designer': { model: 'sonnet', effort: 'medium' } },
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
});
