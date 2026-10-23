/**
 * The team of an Orbito project, read from Claude Code's files: skills (`.claude/skills/<name>/SKILL.md`) and agents
 * (`.claude/agents/<name>.md`). The viewer draws it as a static map: Orbito (the lead, the main session) → agents → skills.
 */

export type SkillInfo = { name: string; description: string };
export type AgentInfo = { name: string; description: string; model?: string; skills: string[] };
export type Team = { lead: { skills: string[] }; agents: AgentInfo[]; skills: SkillInfo[] };

/** What the files hold before they are linked: an agent's body is searched for the skills it uses. */
export type AgentSource = { name: string; description: string; model?: string; body: string };

/** Skills the main session uses itself (the lead); any skill no agent uses also stays with the lead. */
export const LEAD_SKILLS = ['orbito', 'orbito-workspace', 'project-kickoff', 'product-feedback'];

/** Reads the `---` front matter of a skill or agent file: flat `key: value` lines, enough for name, description, model. */
export const parseFrontmatter = (text: string): { data: Record<string, string>; body: string } => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);

  if (!m) return { data: {}, body: text };
  const data: Record<string, string> = {};
  let key: string | undefined;

  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);

    if (kv) {
      key = kv[1]!;
      data[key] = kv[2]!.replace(/^[>|]-?\s*$/, '').replace(/^["']|["']$/g, '');
    } else if (key && /^\s+\S/.test(line)) {
      // folded continuation of a long value
      data[key] = `${data[key] ? `${data[key]} ` : ''}${line.trim()}`;
    }
  }

  return { data, body: m[2]! };
};

/** The part of a skill description that says what it is for, without the trigger list ("Use when …"). */
export const purposeOf = (description: string): string => description.split(/\.\s+Use\b/)[0]!.replace(/\.$/, '') + '.';

export const buildTeam = (skills: SkillInfo[], agents: AgentSource[]): Team => {
  const names = new Set(skills.map((s) => s.name));
  const linked: AgentInfo[] = agents
    .map((a) => ({
      name: a.name,
      description: a.description,
      model: a.model,
      // a skill is used when the agent's instructions name it in backticks, or its description names it as a
      // skill ("use only through the synthetic-usability skill")
      skills: [
        ...new Set([
          ...[...a.body.matchAll(/`([a-z][\w-]*)`/g)].map((m) => m[1]!),
          ...[...names].filter((n) => new RegExp(`(^|[^\\w-])${n} skill\\b`).test(a.description)),
        ]),
      ].filter((n) => names.has(n) && !LEAD_SKILLS.includes(n)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const used = new Set(linked.flatMap((a) => a.skills));
  const lead = skills.map((s) => s.name).filter((n) => LEAD_SKILLS.includes(n) || !used.has(n));

  return { lead: { skills: lead }, agents: linked, skills: [...skills].sort((a, b) => a.name.localeCompare(b.name)) };
};
