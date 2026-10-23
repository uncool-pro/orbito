/**
 * The team of an Orbito project, read from Claude Code's files: skills (`.claude/skills/<name>/SKILL.md`) and agents
 * (`.claude/agents/<name>.md`). Three layers, as the viewer's skills map draws them:
 * - Orbito (the lead, the main session) and the processes it runs (`process-*` skills, with a "## Steps" table);
 * - roles: the agents;
 * - competences: the skills each agent owns (its `skills:` list, or the skills its instructions name).
 */

export type SkillInfo = { name: string; description: string };
export type AgentInfo = { name: string; description: string; model?: string; effort?: string; skills: string[] };
export type ProcessStep = { n: string; step: string; role: string; skill: string; output: string; gate: string };
export type ProcessInfo = { name: string; description: string; steps: ProcessStep[] };
export type Team = { lead: { skills: string[] }; processes: ProcessInfo[]; agents: AgentInfo[]; skills: SkillInfo[]; models?: 'optimal' | 'high' };

/** What the files hold before they are linked. */
export type AgentSource = { name: string; description: string; model?: string; effort?: string; skills?: string[]; body: string };
export type SkillSource = SkillInfo & { body?: string };

/** Skills the main session uses itself (the lead); any competence no agent owns also stays with the lead. */
export const LEAD_SKILLS = ['orbito', 'orbito-workspace', 'project-kickoff', 'product-feedback'];

export const isProcess = (name: string) => name.startsWith('process-');

/**
 * Reads the `---` front matter of a skill or agent file: `key: value` lines, folded continuation lines, and YAML lists
 * (`key:` followed by `  - item` lines, returned as a comma-separated value).
 */
export const parseFrontmatter = (text: string): { data: Record<string, string>; body: string } => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);

  if (!m) return { data: {}, body: text };
  const data: Record<string, string> = {};
  let key: string | undefined;

  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    const item = /^\s+-\s+(.*)$/.exec(line);

    if (kv) {
      key = kv[1]!;
      data[key] = kv[2]!.replace(/^[>|]-?\s*$/, '').replace(/^["']|["']$/g, '');
    } else if (key && item) {
      data[key] = `${data[key] ? `${data[key]}, ` : ''}${item[1]!.trim()}`;
    } else if (key && /^\s+\S/.test(line)) {
      // folded continuation of a long value
      data[key] = `${data[key] ? `${data[key]} ` : ''}${line.trim()}`;
    }
  }

  return { data, body: m[2]! };
};

/** A comma-separated front-matter value as a list. */
export const listOf = (value?: string): string[] | undefined =>
  value
    ? value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

/** The part of a skill description that says what it is for, without the trigger list ("Use when …"). */
export const purposeOf = (description: string): string => description.split(/\.\s+Use\b/)[0]!.replace(/\.$/, '') + '.';

const clean = (cell: string) => cell.replace(/\*\*|`/g, '').trim();

/** The "## Steps" table of a process skill: `| # | Step | Role | Skill | Output | Gate |`. */
export const parseSteps = (body: string): ProcessStep[] => {
  const section = /##\s+Steps\s*\r?\n([\s\S]*?)(?:\r?\n##\s|$)/.exec(body)?.[1] ?? '';

  return section
    .split(/\r?\n/)
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => {
      const [n = '', step = '', role = '', skill = '', output = '', gate = ''] = l.split('|').slice(1, -1).map(clean);

      return { n, step, role, skill, output, gate: gate === '—' ? '' : gate };
    });
};

export const buildTeam = (skills: SkillSource[], agents: AgentSource[]): Team => {
  const names = new Set(skills.map((s) => s.name));
  const competence = (n: string) => names.has(n) && !LEAD_SKILLS.includes(n) && !isProcess(n);
  const linked: AgentInfo[] = agents
    .map((a) => ({
      name: a.name,
      description: a.description,
      model: a.model,
      effort: a.effort,
      // the agent's own `skills:` list when it has one; otherwise the skills its instructions name in backticks, or its
      // description names as a skill ("use only through the synthetic-usability skill")
      skills: (a.skills?.length
        ? a.skills
        : [
            ...new Set([
              ...[...a.body.matchAll(/`([a-z][\w-]*)`/g)].map((m) => m[1]!),
              ...[...names].filter((n) => new RegExp(`(^|[^\\w-])${n} skill\\b`).test(a.description)),
            ]),
          ]
      ).filter(competence),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const used = new Set(linked.flatMap((a) => a.skills));
  const lead = skills.map((s) => s.name).filter((n) => !isProcess(n) && (LEAD_SKILLS.includes(n) || !used.has(n)));
  const processes = skills
    .filter((s) => isProcess(s.name))
    .map((s) => ({ name: s.name, description: s.description, steps: parseSteps(s.body ?? '') }));

  return {
    lead: { skills: lead },
    processes,
    agents: linked,
    skills: skills.map(({ name, description }) => ({ name, description })).sort((a, b) => a.name.localeCompare(b.name)),
  };
};
