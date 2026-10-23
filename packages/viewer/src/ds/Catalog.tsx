import type { ReactNode } from 'react';

import { contrastRatio, DS_LEVELS, TOKEN_GROUPS } from '@uncool-pro/orbito-core';
import type { ComponentDocs, DsComponent, DsIssue, Token } from '@uncool-pro/orbito-core';
import { FrameContext, screenHash } from '@uncool-pro/orbito-runtime';

import { ErrorBoundary } from '../app/ErrorBoundary';
import { useViewer } from '../app/context';
import { useT } from '../i18n';


export const dsHash = (section?: string) => `#/ds${section ? `/${section}` : ''}`;

/**
 * The design-system catalog: a reference for product designers (not a developer storybook). Tokens with their usage
 * notes and contrast, components by atomic level with guidelines and live variants, where each one is used, and what
 * `orbito check ds` found.
 */
export const Catalog = ({ section }: { section?: string }) => {
  const { ds } = useViewer();
  const t = useT();
  const { report } = ds;
  const issuesOf = (name: string) => report.issues.filter((i) => i.component === name);

  let content: ReactNode;

  if (!section) content = <Overview />;
  else if (section === 'health') content = <Issues issues={report.issues} />;
  else if (section.startsWith('tokens/')) content = <TokenGroup group={section.slice(7)} />;
  else {
    const c = report.components.find((x) => x.name === section);

    content = c ? <ComponentPage c={c} docs={ds.docs.find((d) => d.component === c.name)} issues={issuesOf(c.name)} /> : <p>{t.notFound}</p>;
  }

  return (
    <div className="pd-ds">
      <main className="pd-ds__main">{content}</main>
    </div>
  );
};

const Overview = () => {
  const { ds } = useViewer();
  const t = useT();
  const { report } = ds;
  const screens = Object.keys(report.screens).length;

  return (
    <>
      <h1>{t.designSystem}</h1>
      <p className="pd-lead">{t.dsIntro}</p>
      <div className="pd-stats">
        <div>
          <b>{Object.values(report.tokens).flat().length}</b>
          {t.tokens}
        </div>
        {DS_LEVELS.map((l) => (
          <div key={l}>
            <b>{report.components.filter((c) => c.level === l).length}</b>
            {t.levels[l]}
          </div>
        ))}
        <div>
          <b>{screens}</b>
          {t.screens}
        </div>
      </div>
      <h2>{t.health}</h2>
      <HealthSummary />
      <h2>{t.structure}</h2>
      <div className="pd-levels">
        {DS_LEVELS.map((l) => (
          <section key={l}>
            <h3>{t.levels[l]}</h3>
            {report.components
              .filter((c) => c.level === l)
              .map((c) => (
                <a key={c.name} href={dsHash(c.name)} className="pd-comp-chip">
                  <b>{c.name}</b>
                  <small>{t.usedOn(c.screens.length)}</small>
                </a>
              ))}
          </section>
        ))}
      </div>
    </>
  );
};

const HealthSummary = () => {
  const { report } = useViewer().ds;
  const t = useT();
  const c = report.counts;

  return (
    <a href={dsHash('health')} className={`pd-health${c.error ? ' is-error' : c.warning ? ' is-warning' : ' is-ok'}`}>
      {c.error + c.warning === 0 ? t.allRulesPass : t.issuesFound(c.error, c.warning)}
      <small>{t.checkHint}</small>
    </a>
  );
};

const Issues = ({ issues }: { issues: DsIssue[] }) => {
  const t = useT();

  return (
    <>
      <h1>{t.health}</h1>
      <HealthSummary />
      {issues.length > 0 && (
        <ul className="pd-issues">
          {issues.map((i, n) => (
            <IssueRow key={n} issue={i} />
          ))}
        </ul>
      )}
    </>
  );
};

const IssueRow = ({ issue: i }: { issue: DsIssue }) => (
  <li className={`is-${i.severity}`}>
    <div>
      <span className="pd-issue__sev">{i.severity}</span> <code>{i.rule}</code> {i.message}
    </div>
    {(i.file || i.hint) && (
      <small>
        {i.file && (
          <code>
            {i.file}
            {i.line ? `:${i.line}` : ''}
          </code>
        )}{' '}
        {i.hint}
      </small>
    )}
  </li>
);

// ---- components

const ComponentPage = ({ c, docs, issues }: { c: DsComponent; docs?: ComponentDocs<ReactNode>; issues: DsIssue[] }) => {
  const { project } = useViewer();
  const t = useT();
  const byId = new Map(project.screens.map((s) => [s.id, s]));

  return (
    <>
      <div className="pd-comp-head">
        <span className="pd-level">{t.level[c.level]}</span>
        <h1>{c.name}</h1>
        <code>{c.file}</code>
      </div>
      {docs ? <p className="pd-lead">{docs.description}</p> : <p className="pd-lead pd-muted">{t.noDocs(c.name)}</p>}
      {(docs?.guidelines?.do?.length || docs?.guidelines?.dont?.length) && (
        <div className="pd-guides">
          {docs.guidelines.do?.length ? (
            <section className="is-do">
              <h3>{t.do}</h3>
              <ul>
                {docs.guidelines.do.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {docs.guidelines.dont?.length ? (
            <section className="is-dont">
              <h3>{t.dont}</h3>
              <ul>
                {docs.guidelines.dont.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
      {docs && docs.variants.length > 0 && (
        <>
          <h2>{t.variants}</h2>
          <div className="pd-variants">
            {docs.variants.map((v) => (
              <figure key={v.name} className="pd-variant">
                <div className="pd-variant__stage" style={{ background: `var(--${v.background ?? 'color-bg'}, #fff)` }}>
                  <div style={{ width: v.width }}>
                    <FrameContext.Provider value={{ mode: 'catalog', viewport: project.viewports[project.config.defaultViewport]! }}>
                      <ErrorBoundary name={`${c.name} / ${v.name}`}>{v.render()}</ErrorBoundary>
                    </FrameContext.Provider>
                  </div>
                </div>
                <figcaption>
                  <b>{v.name}</b>
                  {v.note && <small>{v.note}</small>}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      <h2>{t.relations}</h2>
      <div className="pd-relations">
        <section>
          <h3>{t.builtFrom}</h3>
          {c.uses.length ? c.uses.map((n) => <Chip key={n} name={n} />) : <small className="pd-muted">{t.onlyTokens}</small>}
        </section>
        <section>
          <h3>{t.usedByComponents}</h3>
          {c.usedBy.length ? c.usedBy.map((n) => <Chip key={n} name={n} />) : <small className="pd-muted">—</small>}
        </section>
        <section>
          <h3>{t.usedOnScreens}</h3>
          {c.screens.length ? (
            c.screens.map((id) => (
              <a key={id} className="pd-comp-chip" href={screenHash(id)}>
                <b>{byId.get(id)?.code ?? id}</b>
                <small>{byId.get(id)?.title}</small>
              </a>
            ))
          ) : (
            <small className="pd-muted">—</small>
          )}
        </section>
      </div>
      {issues.length > 0 && (
        <>
          <h2>{t.health}</h2>
          <ul className="pd-issues">
            {issues.map((i, n) => (
              <IssueRow key={n} issue={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
};

const Chip = ({ name }: { name: string }) => (
  <a className="pd-comp-chip" href={dsHash(name)}>
    <b>{name}</b>
  </a>
);

// ---- tokens

const TokenGroup = ({ group }: { group: string }) => {
  const { report } = useViewer().ds;
  const t = useT();
  const list = report.tokens[group] ?? [];
  const all = new Map(Object.values(report.tokens).flat().map((x) => [x.name, x]));
  const known = (TOKEN_GROUPS as readonly string[]).includes(group);

  return (
    <>
      <h1>{t.groups[group] ?? group}</h1>
      <p className="pd-lead">{t.tokenIntro}</p>
      <div className={`pd-tokens pd-tokens--${known ? group : 'other'}`}>
        {list.map((tok) => (
          <div key={tok.name} className="pd-token">
            <TokenPreview group={group} token={tok} />
            <div className="pd-token__text">
              <b>{tok.name}</b>
              <code>{tok.value}</code>
              {tok.usage ? <p>{tok.usage}</p> : <p className="pd-warn">{t.noUsage}</p>}
              {tok.on?.map((bg) => {
                const b = all.get(bg);
                const ratio = b ? contrastRatio(tok.value, b.value) : null;
                const min = tok.large ? 3 : 4.5;

                return (
                  <span key={bg} className={`pd-contrast${ratio !== null && ratio < min ? ' is-fail' : ''}`} style={{ background: b?.value, color: tok.value }}>
                    Aa {ratio !== null ? `${ratio.toFixed(1)}:1` : '?'} <small>on {bg}</small>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const isDuration = (v: string) => /^\d*\.?\d+m?s$/.test(v.trim());

const TokenPreview = ({ group, token }: { group: string; token: Token }) => {
  const v = `var(--${token.name})`;

  switch (group) {
    case 'color':
      return <span className="pd-swatch" style={{ background: v }} />;
    case 'type':
      return <span className="pd-type-sample" style={{ font: v }}>Water your Monstera today</span>;
    case 'font':
      return <span className="pd-type-sample" style={{ fontFamily: v, fontSize: 28 }}>Aa Bb 123</span>;
    case 'space':
      return <span className="pd-space-bar" style={{ width: v }} />;
    case 'radius':
      return <span className="pd-radius-box" style={{ borderRadius: v }} />;
    case 'shadow':
      return <span className="pd-shadow-box" style={{ boxShadow: v }} />;
    case 'motion':
      return (
        <span className="pd-motion" title="Hover to play">
          <i style={isDuration(token.value) ? { transitionDuration: v } : { transitionTimingFunction: v }} />
        </span>
      );
    default:
      return null;
  }
};
