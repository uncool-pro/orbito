import { describe, expect, it } from 'vitest';

import { buildTeam, parseFrontmatter, purposeOf } from '../src';

describe('team', () => {
  it('reads front matter and the body', () => {
    const { data, body } = parseFrontmatter('---\nname: ux-designer\ndescription: Designs flows. Use for flows.\nmodel: opus\n---\n\nUse `ux-design`.\n');

    expect(data).toEqual({ name: 'ux-designer', description: 'Designs flows. Use for flows.', model: 'opus' });
    expect(body.trim()).toBe('Use `ux-design`.');
  });

  it('keeps the purpose of a description without its triggers', () => {
    expect(purposeOf('Writes stories with criteria. Use when stories are missing.')).toBe('Writes stories with criteria.');
    expect(purposeOf('No trigger list')).toBe('No trigger list.');
  });

  it('links agents to the skills their instructions name; the rest stays with the lead', () => {
    const skills = ['orbito', 'orbito-workspace', 'ux-design', 'design-system', 'sales-copy'].map((name) => ({ name, description: `${name}.` }));
    const team = buildTeam(skills, [
      { name: 'ux-designer', description: 'UX.', model: 'opus', body: 'Use `ux-design` and `orbito-workspace`; run `npm run check:ds`.' },
      { name: 'prototyper', description: 'Builds.', model: 'sonnet', body: 'Use `ux-design`, `design-system`.' },
      { name: 'persona', description: 'One persona. Use only through the sales-copy skill.', model: 'haiku', body: 'Stay in role.' },
    ]);

    expect(team.agents.map((a) => [a.name, a.skills])).toEqual([
      ['persona', ['sales-copy']],
      ['prototyper', ['ux-design', 'design-system']],
      ['ux-designer', ['ux-design']],
    ]);
    expect(team.lead.skills).toEqual(['orbito', 'orbito-workspace']);
  });
});
