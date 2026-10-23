import { useState } from 'react';

import { purposeOf } from '@uncool-pro/orbito-core';
import type { ProcessInfo, SkillInfo } from '@uncool-pro/orbito-core';

import { useViewer } from '../app/context';
import { useT } from '../i18n';

/** "ux-designer" → "UX designer", "process-new-product" → "New product". */
const label = (name: string) =>
  name
    .replace(/^process-/, '')
    .split('-')
    .map((w, i) => (['ux', 'ui', 'ds'].includes(w) ? w.toUpperCase() : i === 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');

/** The order people work in; anything else (the project's own agents and processes) follows alphabetically. */
const ROLE_ORDER = ['business-analyst', 'ux-designer', 'ui-designer', 'design-auditor', 'synthetic-user'];
const PROCESS_ORDER = ['process-new-product', 'process-redesign', 'process-rapid-prototype', 'process-landing-page'];
const byOrder = (order: string[]) => (a: { name: string }, b: { name: string }) => {
  const ia = order.indexOf(a.name), ib = order.indexOf(b.name);

  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.name.localeCompare(b.name);
};

/** Model tier of an agent, as the skills README names them. */
const tier = (model?: string) => (model === 'opus' ? 'strongest' : model === 'haiku' ? 'light' : model ? 'build' : 'inherit');

/** Scrolls to a role's card on the map (the hash is the viewer's route, so no anchors). */
const showRole = (role: string) => document.getElementById(`role-${role}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

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

const Process = ({ p, roles }: { p: ProcessInfo; roles: Set<string> }) => {
  const t = useT();

  return (
    <article className="pd-team__card pd-team__process">
      <div className="pd-team__name">
        <b>{label(p.name)}</b>
        <code className="pd-team__id">{p.name}</code>
      </div>
      <p className="pd-team__role" title={p.description}>
        {purposeOf(p.description)}
      </p>
      <ol className="pd-team__steps">
        {p.steps.map((s) => (
          <li key={s.n}>
            <span className="pd-team__n">{s.n}</span>
            <span className="pd-team__step">
              <b>{s.step}</b>
              {s.role === 'orbito' || !roles.has(s.role) ? (
                <i className="pd-team__chip is-lead">{s.role === 'orbito' ? t.leadName : label(s.role)}</i>
              ) : (
                <button type="button" className="pd-team__chip" onClick={() => showRole(s.role)} title={t.showRole}>
                  {label(s.role)}
                </button>
              )}
              <code>{s.skill}</code>
              {s.gate && <em className="pd-team__gate">{s.gate}</em>}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
};

/**
 * The skills map (`#/skills`): who does what in the project, in three layers — Orbito (the lead) and the processes it
 * runs; the roles (agents) the processes call; and the competences (skills) each role owns, with what they are for.
 * Read from the project's .claude/ folder, so it shows exactly the team this project has.
 */
export const SkillsMap = () => {
  const { team } = useViewer();
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);

  if (!team) return <div className="pd-empty">{t.noTeam}</div>;
  const byName = new Map(team.skills.map((s) => [s.name, s]));
  const agents = [...team.agents].sort(byOrder(ROLE_ORDER));
  const processes = [...team.processes].sort(byOrder(PROCESS_ORDER));
  const roles = new Set(agents.map((a) => a.name));
  const shown = processes.find((p) => p.name === open) ?? processes[0];

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

      {shown && (
        <section className="pd-team__layer">
          <h2>{t.processesTitle}</h2>
          <p className="pd-team__layer-lead">{t.processesLead}</p>
          <div className="pd-team__tabs" role="tablist">
            {processes.map((p) => (
              <button key={p.name} type="button" role="tab" aria-selected={p === shown} className={p === shown ? 'is-on' : ''} onClick={() => setOpen(p.name)}>
                {label(p.name)}
                <small>{t.stepsCount(p.steps.length)}</small>
              </button>
            ))}
          </div>
          <Process p={shown} roles={roles} />
        </section>
      )}

      <section className="pd-team__layer">
        <h2>{t.rolesTitle}</h2>
        <p className="pd-team__layer-lead">{t.rolesLead}</p>
        <div className="pd-team__agents">
          {agents.map((a) => (
            <article key={a.name} id={`role-${a.name}`} className="pd-team__card">
              <div className="pd-team__name">
                <b>{label(a.name)}</b>
                {a.model && <span className={`pd-team__model is-${tier(a.model)}`}>{a.model}</span>}
              </div>
              <p className="pd-team__role" title={a.description}>
                {purposeOf(a.description)}
              </p>
              <p className="pd-team__count">{t.competencesCount(a.skills.length)}</p>
              <SkillList names={a.skills} byName={byName} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
