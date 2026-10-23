import { describe, expect, it } from 'vitest';

import { modelFor, withModel } from '../src';

const agent = '---\nname: ui-designer\ndescription: UI.\nmodel: sonnet\nskills:\n  - ui-design\n---\n\nBody with model: words.\n';

describe('models', () => {
  it('keeps the optimal settings, or takes the high ones for known roles', () => {
    expect(modelFor('ui-designer', 'optimal', { model: 'sonnet', effort: 'medium' })).toEqual({ model: 'sonnet', effort: 'medium' });
    expect(modelFor('ui-designer', 'high', { model: 'sonnet', effort: 'medium' })).toEqual({ model: 'opus', effort: 'high' });
    expect(modelFor('my-agent', 'high', { model: 'haiku' })).toEqual({ model: 'haiku' });
  });

  it('rewrites model and adds effort in the front matter only', () => {
    const out = withModel(agent, { model: 'opus', effort: 'high' });

    expect(out).toContain('model: opus\neffort: high\nskills:');
    expect(out).toContain('Body with model: words.');
    expect(withModel(out, { model: 'sonnet', effort: 'medium' })).toContain('model: sonnet\neffort: medium\nskills:');
  });
});
