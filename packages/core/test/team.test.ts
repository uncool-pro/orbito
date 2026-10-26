import { describe, expect, it } from 'vitest';

import { buildTeam, listOf, parseFrontmatter, parseSteps, purposeOf } from '../src';

describe('team', () => {
  it('reads front matter, YAML lists and the body', () => {
    const { data, body } = parseFrontmatter('---\nname: ux-designer\ndescription: Designs flows. Use for flows.\nmodel: opus\nskills:\n  - user-flows\n  - wireframes\n---\n\nUse `user-flows`.\n');

    expect(data).toEqual({ name: 'ux-designer', description: 'Designs flows. Use for flows.', model: 'opus', skills: 'user-flows, wireframes' });
    expect(listOf(data.skills)).toEqual(['user-flows', 'wireframes']);
    expect(body.trim()).toBe('Use `user-flows`.');
  });

  it('keeps the purpose of a description without its triggers', () => {
    expect(purposeOf('Writes stories with criteria. Use when stories are missing.')).toBe('Writes stories with criteria.');
    expect(purposeOf('No trigger list')).toBe('No trigger list.');
  });

  it('reads the steps of a process', () => {
    const steps = parseSteps('# P\n\n## Steps\n| # | Step | Role | Skill | Output | Gate |\n|---|---|---|---|---|---|\n| 1 | Paths | ux-designer | user-flows | `flows/` | **person approves** |\n| 2 | Look | ui-designer | look-and-feel | variants | — |\n\n## Notes\n| 9 | not a step |');

    expect(steps).toEqual([
      { n: '1', step: 'Paths', role: 'ux-designer', skill: 'user-flows', output: 'flows/', gate: 'person approves' },
      { n: '2', step: 'Look', role: 'ui-designer', skill: 'look-and-feel', output: 'variants', gate: '' },
    ]);
  });

  it('gives agents their own skills list, falls back to the names in their text, and keeps processes apart', () => {
    const skills = ['orbito', 'orbito-workspace', 'user-flows', 'wireframes', 'design-system', 'sales-copy', 'synthetic-usability', 'process-new-product'].map((name) => ({
      name,
      description: `${name}.`,
      body: name === 'process-new-product' ? '## Steps\n| 1 | Paths | ux-designer | user-flows | flows | — |\n' : '',
    }));
    const team = buildTeam(skills, [
      { name: 'ux-designer', description: 'UX.', model: 'opus', skills: ['user-flows', 'wireframes', 'orbito-workspace'], body: 'Also mentions `design-system`.' },
      { name: 'prototyper', description: 'Builds.', model: 'sonnet', body: 'Use `wireframes`, `design-system`; run `npm run check:ds`.' },
      { name: 'persona', description: 'One persona. Use only through the synthetic-usability skill.', model: 'haiku', body: 'Stay in role.' },
    ]);

    expect(team.agents.map((a) => [a.name, a.skills])).toEqual([
      ['persona', ['synthetic-usability']],
      ['prototyper', ['wireframes', 'design-system']],
      ['ux-designer', ['user-flows', 'wireframes']],
    ]);
    expect(team.lead.skills).toEqual(['orbito', 'orbito-workspace', 'sales-copy']);
    expect(team.processes).toEqual([{ name: 'process-new-product', description: 'process-new-product.', steps: [{ n: '1', step: 'Paths', role: 'ux-designer', skill: 'user-flows', output: 'flows', gate: '' }] }]);
  });

  it("keeps the project's own skills and agents apart from Orbito's team", () => {
    const team = buildTeam(
      [
        { name: 'orbito', description: 'orbito.' },
        { name: 'wireframes', description: 'wireframes.' },
        { name: 'team-brand-rules', description: 'our brand.', own: true },
      ],
      [
        { name: 'ux-designer', description: 'ux.', skills: ['wireframes'], body: '' },
        { name: 'team-reviewer', description: 'ours.', skills: ['team-brand-rules'], body: '', own: true },
      ],
    );

    expect(team.lead.skills).toEqual(['orbito']);
    expect(team.agents.map((a) => a.name)).toEqual(['ux-designer']);
    expect(team.own).toEqual({ skills: ['team-brand-rules'], agents: [expect.objectContaining({ name: 'team-reviewer', skills: ['team-brand-rules'] })] });
  });
});
