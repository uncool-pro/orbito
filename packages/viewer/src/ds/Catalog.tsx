import type { ReactNode } from 'react';

import { contrastRatio, DS_LEVELS, TOKEN_GROUPS } from '@uncool-pro/orbito-core';
import type { ComponentDocs, DsComponent, DsIssue, Token } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

import { dsHash, screenHash } from '../app/routes';
import { ErrorBoundary } from '../app/ErrorBoundary';
import { useViewer } from '../app/context';
import { useShell } from '../app/shell/state';
import { useT } from '../i18n';

/**
 * The design-system catalog: a reference for product designers, laid out the way design systems people know are (Material,
 * Human Interface Guidelines, a Storybook docs page). The overview shows the foundations and a gallery of the components,
 * live; a component page leads with the component itself, then its variants, how to use it and where it is used; tokens
 * read as one table each. What `orbito check ds` found stays one click away.
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

    content = c ? (
      <ComponentPage c={c} docs={ds.docs.find((d) => d.component === c.name)} issues={issuesOf(c.name)} />
    ) : (
      <p>{t.notFound}</p>
    );
  }

  return (
    <div className="pd-ds">
      <main className="pd-ds__main">{content}</main>
    </div>
  );
};

/** One variant of a component, live, in the project's default viewport. */
const Live = ({ c, v }: { c: string; v: ComponentDocs<ReactNode>['variants'][number] }) => {
  const { project } = useViewer();

  return (
    <div style={{ width: v.width }}>
      <FrameContext.Provider value={{ mode: 'catalog', viewport: project.viewports[project.config.defaultViewport]! }}>
        <ErrorBoundary name={`${c} / ${v.name}`}>{v.render()}</ErrorBoundary>
      </FrameContext.Provider>
    </div>
  );
};

const Overview = () => {
  const { ds, project } = useViewer();
  const t = useT();
  const { report } = ds;
  const groups = Object.keys(report.tokens).filter((g) => report.tokens[g]?.length);

  return (
    <>
      <header className="pd-ds__hero">
        <p className="pd-eyebrow">{project.config.title}</p>
        <h1>{t.designSystem}</h1>
        <p className="pd-lead">{t.dsIntro}</p>
        <HealthLine />
      </header>
      <h2>{t.foundations}</h2>
      <div className="pd-foundations">
        {groups.map((g) => (
          <a key={g} href={dsHash(`tokens/${g}`)} className="pd-foundation">
            <span className="pd-foundation__preview">
              <FoundationPreview group={g} tokens={report.tokens[g]!} />
            </span>
            <b>{t.groups[g] ?? g}</b>
            <small>{t.tokensCount(report.tokens[g]!.length)}</small>
          </a>
        ))}
      </div>
      {DS_LEVELS.map((level) => {
        const list = report.components.filter((c) => c.level === level);

        return list.length ? (
          <section key={level}>
            <h2>{t.levels[level]}</h2>
            <div className="pd-gallery">
              {list.map((c) => {
                const docs = ds.docs.find((d) => d.component === c.name);
                const first = docs?.variants[0];

                return (
                  <a key={c.name} href={dsHash(c.name)} className="pd-gallery__item">
                    <span
                      className={`pd-gallery__stage pd-gallery__stage--${level}`}
                      style={first ? { background: `var(--${first.background ?? 'color-bg'}, #fff)` } : undefined}
                    >
                      {first ? (
                        <span className="pd-gallery__live" inert>
                          <Live c={c.name} v={first} />
                        </span>
                      ) : (
                        <span className="pd-muted">{t.noDocsShort}</span>
                      )}
                    </span>
                    <b>{c.name}</b>
                    <small>{t.usedOn(c.screens.length)}</small>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null;
      })}
    </>
  );
};

/** Small pictures of a token group for the overview: a strip of colours, a type sample, bars of spacing… */
const FoundationPreview = ({ group, tokens }: { group: string; tokens: Token[] }) => {
  const v = (tok: Token) => `var(--${tok.name})`;

  switch (group) {
    case 'color':
      return (
        <span className="pd-fp-colors">
          {tokens.slice(0, 8).map((tok) => (
            <i key={tok.name} style={{ background: v(tok) }} />
          ))}
        </span>
      );
    case 'type':
      return <span style={{ font: v(tokens[0]!), color: 'var(--pd-ink)' }}>Aa</span>;
    case 'font':
      return <span style={{ fontFamily: v(tokens[0]!), fontSize: 30, color: 'var(--pd-ink)' }}>Aa</span>;
    case 'space':
      return (
        <span className="pd-fp-space">
          {tokens.slice(0, 6).map((tok) => (
            <i key={tok.name} style={{ width: v(tok) }} />
          ))}
        </span>
      );
    case 'radius':
      return (
        <span className="pd-fp-radius">
          {tokens.slice(0, 3).map((tok) => (
            <i key={tok.name} style={{ borderRadius: v(tok) }} />
          ))}
        </span>
      );
    case 'shadow':
      return <i className="pd-fp-shadow" style={{ boxShadow: v(tokens[0]!) }} />;
    case 'motion':
      return <i className="pd-fp-motion" />;
    default:
      return <span className="pd-muted">{tokens.length}</span>;
  }
};

/** Whether the design system follows its rules, in one quiet line that leads to the details. */
const HealthLine = () => {
  const { report } = useViewer().ds;
  const t = useT();
  const c = report.counts;
  const state = c.error ? 'is-error' : c.warning ? 'is-warning' : 'is-ok';

  return (
    <a href={dsHash('health')} className={`pd-healthline ${state}`}>
      <i />
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
      <HealthLine />
      {issues.length > 0 && (
        <ul className="pd-issues">
          {issues.map((i, n) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the report lists issues in a fixed order and has no ids
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
  const { screens: byId, nameOf } = useViewer();
  const { devMode } = useShell();
  const t = useT();
  const [hero, ...rest] = docs?.variants ?? [];
  const guide: { do?: string[]; dont?: string[] } = docs?.guidelines ?? {};
  const usage = !!(guide.do?.length || guide.dont?.length);

  return (
    <>
      <p className="pd-eyebrow">{t.level[c.level]}</p>
      <h1>{c.name}</h1>
      {docs ? <p className="pd-lead">{docs.description}</p> : <p className="pd-lead pd-muted">{t.noDocs(c.name)}</p>}
      {devMode && <code className="pd-ds-file">{c.file}</code>}
      <nav className="pd-ds-tabs" aria-label={c.name}>
        {hero && (
          <a href={`${dsHash(c.name)}`} onClick={jumpTo('pd-variants')}>
            {t.variants}
          </a>
        )}
        {usage && (
          <a href={`${dsHash(c.name)}`} onClick={jumpTo('pd-usage')}>
            {t.usage}
          </a>
        )}
        <a href={`${dsHash(c.name)}`} onClick={jumpTo('pd-used')}>
          {t.relations}
        </a>
        {issues.length > 0 && (
          <a href={`${dsHash(c.name)}`} onClick={jumpTo('pd-comp-health')}>
            {t.health}
          </a>
        )}
      </nav>
      {hero && (
        <figure className="pd-hero" style={{ backgroundColor: `var(--${hero.background ?? 'color-bg'}, #fff)` }}>
          <Live c={c.name} v={hero} />
          <figcaption>{hero.name}</figcaption>
        </figure>
      )}
      {rest.length > 0 && (
        <>
          <h2 id="pd-variants">{t.variants}</h2>
          <div className="pd-variants">
            {rest.map((v) => (
              <figure key={v.name} className="pd-variant">
                <figcaption>
                  <b>{v.name}</b>
                  {v.note && <small>{v.note}</small>}
                </figcaption>
                <div className="pd-variant__stage" style={{ background: `var(--${v.background ?? 'color-bg'}, #fff)` }}>
                  <Live c={c.name} v={v} />
                </div>
              </figure>
            ))}
          </div>
        </>
      )}
      {usage && (
        <>
          <h2 id="pd-usage">{t.usage}</h2>
          <div className="pd-guides">
            {guide.do?.length ? (
              <section className="is-do">
                <h3>{t.do}</h3>
                <ul>
                  {guide.do.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {guide.dont?.length ? (
              <section className="is-dont">
                <h3>{t.dont}</h3>
                <ul>
                  {guide.dont.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </>
      )}
      <h2 id="pd-used">{t.relations}</h2>
      <dl className="pd-relations">
        <dt>{t.builtFrom}</dt>
        <dd>
          {c.uses.length ? (
            c.uses.map((n) => <Chip key={n} name={n} />)
          ) : (
            <span className="pd-muted">{t.onlyTokens}</span>
          )}
        </dd>
        <dt>{t.usedByComponents}</dt>
        <dd>
          {c.usedBy.length ? c.usedBy.map((n) => <Chip key={n} name={n} />) : <span className="pd-muted">—</span>}
        </dd>
        <dt>{t.usedOnScreens}</dt>
        <dd>
          {c.screens.length ? (
            c.screens.map((id) => (
              <a key={id} className="pd-chip" href={screenHash(id)} title={byId.get(id)?.title}>
                <b>{byId.get(id)?.code ?? id}</b> {byId.has(id) ? nameOf(id) : null}
              </a>
            ))
          ) : (
            <span className="pd-muted">—</span>
          )}
        </dd>
      </dl>
      {issues.length > 0 && (
        <>
          <h2 id="pd-comp-health">{t.health}</h2>
          <ul className="pd-issues">
            {issues.map((i, n) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the report lists issues in a fixed order and has no ids
              <IssueRow key={n} issue={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
};

/** The section links of a component page scroll within the catalog; the address keeps naming the component. */
const jumpTo = (id: string) => (e: { preventDefault: () => void }) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Chip = ({ name }: { name: string }) => (
  <a className="pd-chip" href={dsHash(name)}>
    <b>{name}</b>
  </a>
);

// ---- tokens

const TokenGroup = ({ group }: { group: string }) => {
  const { report } = useViewer().ds;
  const t = useT();
  const list = report.tokens[group] ?? [];
  const all = new Map(
    Object.values(report.tokens)
      .flat()
      .map((x) => [x.name, x]),
  );
  const known = (TOKEN_GROUPS as readonly string[]).includes(group);

  return (
    <>
      <p className="pd-eyebrow">{t.foundations}</p>
      <h1>{t.groups[group] ?? group}</h1>
      <p className="pd-lead">{t.tokenIntro}</p>
      <div className={`pd-tokentable pd-tokentable--${known ? group : 'other'}`}>
        {list.map((tok) => (
          <div key={tok.name} className="pd-tokenrow">
            <span className="pd-tokenrow__preview">
              <TokenPreview group={group} token={tok} />
            </span>
            <span className="pd-tokenrow__name">
              <b>{tok.name}</b>
              <code>{tok.value}</code>
            </span>
            <span className="pd-tokenrow__usage">
              {tok.usage ? <span>{tok.usage}</span> : <span className="pd-warn">{t.noUsage}</span>}
              {tok.on?.length ? (
                <span className="pd-tokenrow__contrast">
                  {tok.on.map((bg) => {
                    const b = all.get(bg);
                    const ratio = b ? contrastRatio(tok.value, b.value) : null;
                    const min = tok.large ? 3 : 4.5;

                    return (
                      <span
                        key={bg}
                        className={`pd-contrast${ratio !== null && ratio < min ? ' is-fail' : ''}`}
                        style={{ background: b?.value, color: tok.value }}
                        title={`${tok.name} on ${bg}`}
                      >
                        Aa {ratio !== null ? `${ratio.toFixed(1)}:1` : '?'} <small>on {bg}</small>
                      </span>
                    );
                  })}
                </span>
              ) : null}
            </span>
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
      return (
        <span className="pd-type-sample" style={{ font: v }}>
          Water your Monstera today
        </span>
      );
    case 'font':
      return (
        <span className="pd-type-sample" style={{ fontFamily: v, fontSize: 28 }}>
          Aa Bb 123
        </span>
      );
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
