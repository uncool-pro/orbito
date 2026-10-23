import { purposeOf } from '@uncool-pro/orbito-core';
import type { SkillInfo } from '@uncool-pro/orbito-core';

import { useViewer } from '../app/context';
import { useT } from '../i18n';

/** "ux-designer" → "UX designer". */
const label = (name: string) =>
  name
    .split('-')
    .map((w, i) => (['ux', 'ui', 'ds'].includes(w) ? w.toUpperCase() : i === 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');

/** Model tier of an agent, as the skills README names them. */
const tier = (model?: string) => (model === 'opus' ? 'strongest' : model === 'haiku' ? 'light' : model ? 'build' : 'inherit');

const SkillList = ({ names, byName }: { names: string[]; byName: Map<string, SkillInfo> }) => (
  <ul className="pd-team__skills">
    {names.map((n) => (
      <li key={n}>
        <code>{n}</code>
        <span title={byName.get(n)?.description}>{byName.get(n)?.description ? purposeOf(byName.get(n)!.description) : ''}</span>
      </li>
    ))}
  </ul>
);

/**
 * The skills map (`#/skills`): a static picture of who does what in the project — Orbito (the lead) on top, the agents
 * under it, and the skills each one uses with what they are for. Read from the project's .claude/ folder, so it shows
 * exactly the skills this project has.
 */
export const SkillsMap = () => {
  const { team } = useViewer();
  const t = useT();

  if (!team) return <div className="pd-empty">{t.noTeam}</div>;
  const byName = new Map(team.skills.map((s) => [s.name, s]));

  return (
    <div className="pd-team">
      <header className="pd-team__head">
        <h1>{t.skillsTitle}</h1>
        <p>{t.skillsLead}</p>
      </header>

      <section className="pd-team__lead">
        <div className="pd-team__card pd-team__card--lead">
          <div className="pd-team__name">
            <i className="pd-logo" aria-hidden />
            <b>{t.leadName}</b>
            <span className="pd-team__model is-strongest">{t.leadModel}</span>
          </div>
          <p className="pd-team__role">{t.leadRole}</p>
          <p className="pd-team__count">{t.skillsCount(team.lead.skills.length)}</p>
          <SkillList names={team.lead.skills} byName={byName} />
        </div>
      </section>

      <div className="pd-team__agents">
        {team.agents.map((a) => (
          <article key={a.name} className="pd-team__card">
            <div className="pd-team__name">
              <b>{label(a.name)}</b>
              {a.model && <span className={`pd-team__model is-${tier(a.model)}`}>{a.model}</span>}
            </div>
            <p className="pd-team__role" title={a.description}>{purposeOf(a.description)}</p>
            <p className="pd-team__count">{t.skillsCount(a.skills.length)}</p>
            <SkillList names={a.skills} byName={byName} />
          </article>
        ))}
      </div>
    </div>
  );
};
