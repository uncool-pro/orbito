import { describe, expect, it } from 'vitest';

import { parseRequirements } from '../src';

const md = `# EP-01 · Plants get watered on time
Goal: plant owners keep plants watered without remembering it themselves.

## REQ-01 · Add a plant with its watering interval
- Status: draft            (draft · ready · approved)
- Priority: must
- Flows: P2
- Screens: PL-04

As a plant owner, I want to add a plant, so that I get reminded on time.

Acceptance criteria
- Given the name is empty, when I try to save, then nothing is saved.

## REQ-02 · See which plants need water today
- Status: ready

As a plant owner, I want to see today's plants first.
`;

describe('parseRequirements', () => {
  const reqs = parseRequirements('requirements/plants.md', md);

  it('reads every story with its epic, status and priority', () => {
    expect(reqs.map((r) => r.id)).toEqual(['REQ-01', 'REQ-02']);
    expect(reqs[0]).toMatchObject({ title: 'Add a plant with its watering interval', epic: 'EP-01 · Plants get watered on time', status: 'draft', priority: 'must', file: 'requirements/plants.md' });
    expect(reqs[1]).toMatchObject({ status: 'ready' });
  });

  it('keeps the story and its criteria as written, without the board’s own links', () => {
    expect(reqs[0]!.text).toBe('As a plant owner, I want to add a plant, so that I get reminded on time.\n\nAcceptance criteria\n- Given the name is empty, when I try to save, then nothing is saved.');
    expect(reqs[0]!.text).not.toContain('Flows:');
  });

  it('skips text outside a story', () => {
    expect(reqs.some((r) => r.text.includes('Goal:'))).toBe(false);
  });
});
