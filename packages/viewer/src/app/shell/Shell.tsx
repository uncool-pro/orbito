import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { DS_LEVELS, statusOf, STATUSES, targetsOf } from '@uncool-pro/orbito-core';
import type { Page, Project, Screen, Status } from '@uncool-pro/orbito-core';
import { screenHash } from '@uncool-pro/orbito-runtime';

import { LiveScreen } from '../../board/BoardCard';
import { useT } from '../../i18n';
import { useStatuses } from '../../status';
import { useViewer } from '../context';
import { StatusChip } from '../StatusChip';
import { useInspectorExtra, useShell, useZoom } from './state';

export type Mode = 'board' | 'flows' | 'prototype' | 'ds' | 'skills';

/** Modes that are full pages of their own: no canvas island, no screen inspector. */
const isPage = (mode: Mode) => mode === 'ds' || mode === 'skills';

type ShellProps = { mode: Mode; page?: Page; flowKey?: string; dsSection?: string; children: ReactNode };

/** The page a screen belongs to: the first page with a flow (or a version) that lists it. */
export const pageOfScreen = (project: Project<ComponentType>, id: string): Page | undefined =>
  project.pages.find((p) => p.flows.some((f) => f.screens.includes(id) || (f.versions ?? []).some((v) => v.screens.some((s) => s.id === id))));

const Glyph = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const PANEL_LEFT = 'M4 5h16v14H4zM9 5v14';
const PANEL_RIGHT = 'M4 5h16v14H4zM15 5v14';

/**
 * App shell, after Figma: a thin top bar (where am I, search, health), a left panel with the hierarchy
 * (project: pages → flows → screens; design system: tokens and components), the canvas in the middle,
 * an inspector on the right (the selected screen, or view options), and an island at the bottom to switch modes and zoom.
 */
export const Shell = ({ mode, page, flowKey, dsSection, children }: ShellProps) => {
  const { drawerOpen, inspectorOpen } = useShell();

  return (
    <div className={`pd-shell${drawerOpen ? '' : ' no-drawer'}${inspectorOpen && !isPage(mode) ? '' : ' no-inspector'}`}>
      <TopBar mode={mode} page={page} flowKey={flowKey} />
      {drawerOpen && <Drawer mode={mode} page={page} flowKey={flowKey} dsSection={dsSection} />}
      <main className="pd-main">
        {children}
        {!isPage(mode) && <Island mode={mode} page={page} flowKey={flowKey} />}
      </main>
      {inspectorOpen && !isPage(mode) && <Inspector mode={mode} />}
    </div>
  );
};

// ---------------------------------------------------------------- top bar

const TopBar = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { project, problems, ds } = useViewer();
  const { togglePanel } = useShell();
  const t = useT();
  const flow = page?.flows.find((f) => f.key === flowKey);
  const issues = problems.length + ds.report.counts.error + ds.report.counts.warning;
  const base = mode === 'flows' ? 'flows' : 'board';

  return (
    <header className="pd-top" data-pd-ui>
      <button type="button" className="pd-iconbtn" onClick={() => togglePanel('drawer')} aria-label={t.toggleDrawer} title={t.toggleDrawer}>
        <Glyph d={PANEL_LEFT} />
      </button>
      <nav className="pd-crumbs" aria-label={t.location}>
        <a className="pd-crumbs__project" href="#/board">
          <i className="pd-logo" aria-hidden />
          {project.config.title}
        </a>
        {mode === 'ds' || mode === 'skills' ? (
          <>
            <span>/</span>
            <a href={mode === 'ds' ? '#/ds' : '#/skills'}>{mode === 'ds' ? t.designSystem : t.skills}</a>
          </>
        ) : (
          page && (
            <>
              <span>/</span>
              <a href={`#/${base}/${page.key}`}>{page.name}</a>
              {flow && (
                <>
                  <span>/</span>
                  <a href={`#/${base}/${page.key}/${flow.key}`}>
                    <b>{flow.key}</b> {flow.name}
                  </a>
                </>
              )}
            </>
          )
        )}
      </nav>
      <a className={`pd-topnav${mode === 'skills' ? ' is-on' : ''}`} href="#/skills" aria-current={mode === 'skills' ? 'page' : undefined}>
        {t.skills}
      </a>
      <ModelsBadge />
      <Search mode={mode} />
      <a className={`pd-health-pill${issues ? ' is-warn' : ''}`} href="#/ds/health" title={t.health}>
        {issues ? `${issues} ${t.issuesShort}` : `✓ ${t.health}`}
      </a>
      {!isPage(mode) && (
        <button type="button" className="pd-iconbtn" onClick={() => togglePanel('inspector')} aria-label={t.toggleInspector} title={t.toggleInspector}>
          <Glyph d={PANEL_RIGHT} />
        </button>
      )}
    </header>
  );
};

/** The model mode of the team (optimal or high), with what it means and how to change it. */
export const ModelsBadge = () => {
  const { team } = useViewer();
  const t = useT();

  if (!team) return null;
  const mode = team.models ?? 'optimal';

  return (
    <span className="pd-models">
      <a className={`pd-models__pill is-${mode}`} href="#/skills" aria-describedby="pd-models-tip">
        {t.modelsBadge[mode]}
      </a>
      <span id="pd-models-tip" role="tooltip" className="pd-models__tip">
        {t.modelsTip[mode]}
        <em>{t.modelsSource[team.modelsSource ?? 'default']}</em>
        <b>{t.modelsSwitch[mode]}</b>
      </span>
    </span>
  );
};

const Search = ({ mode }: { mode: Mode }) => {
  const { project } = useViewer();
  const { select } = useShell();
  const t = useT();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const k = q.trim().toLowerCase();

    if (!k) return [];

    return project.screens.filter((s) => s.id.includes(k) || (s.code ?? '').toLowerCase().includes(k) || s.title.toLowerCase().includes(k)).slice(0, 8);
  }, [q, project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (s: Screen<ComponentType>) => {
    const p = pageOfScreen(project, s.id);

    setQ('');
    setOpen(false);
    input.current?.blur();
    if (mode === 'prototype' || !p) return void (window.location.hash = screenHash(s.id));
    select(s.id, { focus: true });
    const base = mode === 'flows' ? 'flows' : 'board';

    if (!window.location.hash.startsWith(`#/${base}/${p.key}`)) window.location.hash = `#/${base}/${p.key}`;
  };

  return (
    <div className="pd-search">
      <input
        ref={input}
        className="pd-search__input"
        placeholder={t.search}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0]);
          if (e.key === 'Escape') {
            setQ('');
            input.current?.blur();
          }
        }}
      />
      <kbd>Ctrl K</kbd>
      {open && q.trim() && (
        <ul className="pd-search__results">
          {results.length === 0 && <li className="pd-muted">{t.noResults}</li>}
          {results.map((s) => (
            <li key={s.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(s)}>
                <b>{s.code ?? s.id}</b> {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- left panel

const Drawer = ({ mode, page, flowKey, dsSection }: { mode: Mode; page?: Page; flowKey?: string; dsSection?: string }) => {
  const t = useT();
  const [tab, setTab] = useState<'project' | 'ds'>(mode === 'ds' ? 'ds' : 'project');

  useEffect(() => setTab(mode === 'ds' ? 'ds' : 'project'), [mode]);

  return (
    <aside className="pd-drawer" data-pd-ui>
      <div className="pd-drawer__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'project'} className={tab === 'project' ? 'is-on' : ''} onClick={() => setTab('project')}>
          {t.projectTab}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'ds'} className={tab === 'ds' ? 'is-on' : ''} onClick={() => setTab('ds')}>
          {t.designSystem}
        </button>
      </div>
      <div className="pd-drawer__body">{tab === 'project' ? <ProjectTree mode={mode} page={page} flowKey={flowKey} /> : <DsTree section={dsSection} />}</div>
    </aside>
  );
};

const ProjectTree = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { project } = useViewer();
  const { selected, select } = useShell();
  const statuses = useStatuses();
  const t = useT();
  const base = mode === 'flows' ? 'flows' : 'board';
  const byId = new Map(project.screens.map((s) => [s.id, s]));
  const [open, setOpen] = useState<Set<string>>(() => new Set(flowKey ? [flowKey] : page?.flows.slice(0, 2).map((f) => f.key)));

  useEffect(() => {
    if (flowKey) setOpen((o) => new Set([...o, flowKey]));
  }, [flowKey]);

  const pick = (id: string) => {
    if (mode === 'prototype') return void (window.location.hash = screenHash(id));
    select(id, { focus: true });
  };
  const row = (id: string, extra?: string) => {
    const s = byId.get(id);

    if (!s) return null;

    return (
      <li key={`${extra ?? ''}${id}`}>
        <button
          type="button"
          className={`pd-tree__screen${selected === id ? ' is-on' : ''}`}
          onClick={() => pick(id)}
          onDoubleClick={() => (window.location.hash = screenHash(id))}
          title={s.title}
        >
          <i className={`pd-dot pd-status--${statusOf(statuses, id).status}`} />
          <b>{s.code ?? '·'}</b>
          <span>{s.title.split(' / ').pop()}</span>
        </button>
      </li>
    );
  };

  return (
    <nav className="pd-tree" aria-label={t.pages}>
      <h4>{t.pages}</h4>
      {project.pages.map((p) => {
        const current = p.key === page?.key;

        return (
          <div key={p.key} className={`pd-tree__page${current ? ' is-current' : ''}`}>
            <a className="pd-tree__pagelink" href={`#/${base}/${p.key}`}>
              {p.name}
              <small>{p.flows.length}</small>
            </a>
            {current && (
              <ul className="pd-tree__flows">
                <li>
                  <a className={`pd-tree__flow${flowKey ? '' : ' is-on'}`} href={`#/${base}/${p.key}`}>
                    {t.allFlows}
                  </a>
                </li>
                {p.flows.map((f) => {
                  const expanded = open.has(f.key);

                  return (
                    <li key={f.key}>
                      <div className="pd-tree__flowrow">
                        <button
                          type="button"
                          className="pd-tree__toggle"
                          aria-expanded={expanded}
                          aria-label={expanded ? t.collapse : t.expand}
                          onClick={() => setOpen((o) => (o.has(f.key) ? new Set([...o].filter((k) => k !== f.key)) : new Set([...o, f.key])))}
                        >
                          {expanded ? '▾' : '▸'}
                        </button>
                        <a className={`pd-tree__flow${flowKey === f.key ? ' is-on' : ''}`} href={`#/${base}/${p.key}/${f.key}`} title={t.pathKinds[f.path ?? 'happy']}>
                          <i className={`pd-path-dot pd-path--${f.path ?? 'happy'}`} />
                          <b>{f.key}</b> {f.name}
                        </a>
                      </div>
                      {expanded && (
                        <ul className="pd-tree__screens">
                          {f.screens.map((id, i) => row(id, `${f.key}${i}`))}
                          {(f.versions ?? []).map((v) => (
                            <li key={v.key} className="pd-tree__version">
                              <span>
                                ⑂ {v.name} <small>{v.state}</small>
                              </span>
                              <ul className="pd-tree__screens">{v.screens.map((vs) => row(vs.id, `${f.key}/${v.key}`))}</ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const DsTree = ({ section }: { section?: string }) => {
  const { ds } = useViewer();
  const t = useT();
  const { report } = ds;
  const issuesOf = (name: string) => report.issues.some((i) => i.component === name && i.severity !== 'info');

  return (
    <nav className="pd-tree" aria-label={t.designSystem}>
      <a className={`pd-tree__item${!section ? ' is-on' : ''}`} href="#/ds">
        {t.overview}
      </a>
      <a className={`pd-tree__item${section === 'health' ? ' is-on' : ''}`} href="#/ds/health">
        {t.health} {report.counts.error + report.counts.warning > 0 ? <span className="pd-count is-error">{report.counts.error + report.counts.warning}</span> : <span className="pd-count is-ok">✓</span>}
      </a>
      <h4>{t.tokens}</h4>
      {Object.keys(report.tokens).map((g) => (
        <a key={g} className={`pd-tree__item${section === `tokens/${g}` ? ' is-on' : ''}`} href={`#/ds/tokens/${g}`}>
          {t.groups[g] ?? g} <small>{report.tokens[g]?.length}</small>
        </a>
      ))}
      {DS_LEVELS.map((level) => {
        const list = report.components.filter((c) => c.level === level);

        return list.length ? (
          <div key={level}>
            <h4>{t.levels[level]}</h4>
            {list.map((c) => (
              <a key={c.name} className={`pd-tree__item${section === c.name ? ' is-on' : ''}`} href={`#/ds/${c.name}`}>
                {c.name}
                {issuesOf(c.name) && <i className="pd-dot pd-status--changes" />}
              </a>
            ))}
          </div>
        ) : null;
      })}
    </nav>
  );
};

// ---------------------------------------------------------------- inspector

const Inspector = ({ mode }: { mode: Mode }) => {
  const { selected } = useShell();
  const { project } = useViewer();
  const extra = useInspectorExtra();
  const s = selected ? project.screens.find((x) => x.id === selected) : undefined;

  return (
    <aside className="pd-inspector" data-pd-ui>
      {s ? <ScreenInspector screen={s} mode={mode} /> : (
        <>
          {mode !== 'prototype' && extra}
          <ViewOptionsPanel mode={mode} />
        </>
      )}
    </aside>
  );
};

const ScreenInspector = ({ screen: s, mode }: { screen: Screen<ComponentType>; mode: Mode }) => {
  const { project, links, ds } = useViewer();
  const { select } = useShell();
  const statuses = useStatuses();
  const t = useT();
  const vp = project.viewports[s.viewport ?? project.config.defaultViewport]!;
  const scale = Math.min(236 / vp.width, 300 / vp.height);
  const frame = { x: 0, y: 0, w: Math.round(vp.width * scale), h: Math.round(vp.height * scale), scale };
  const byId = new Map(project.screens.map((x) => [x.id, x]));
  const out = links ? targetsOf(links, s.id) : [];
  const into = links ? Object.keys(links).filter((id) => targetsOf(links, id).includes(s.id)) : [];
  const inFlows = project.pages.flatMap((p) => p.flows.filter((f) => f.screens.includes(s.id)).map((f) => ({ p, f })));
  const parts = ds.report.screens[s.id] ?? [];
  const chip = (id: string) => (
    <button key={id} type="button" className="pd-mini-chip" onClick={() => (mode === 'prototype' ? (window.location.hash = screenHash(id)) : select(id, { focus: true }))}>
      <b>{byId.get(id)?.code ?? id}</b> {byId.get(id)?.title.split(' / ').pop()}
    </button>
  );

  return (
    <div className="pd-insp">
      <div className="pd-insp__head">
        <b>{s.code ?? s.id}</b>
        <button type="button" className="pd-iconbtn pd-iconbtn--sm" onClick={() => select(null)} aria-label={t.close}>
          ×
        </button>
      </div>
      <p className="pd-insp__title">{s.title}</p>
      {mode !== 'prototype' && (
        <div className="pd-insp__preview" style={{ width: frame.w, height: frame.h }}>
          <LiveScreen screen={s} viewport={vp} card={{ frame }} />
        </div>
      )}
      {s.code && (
        <section>
          <h4>{t.status}</h4>
          <StatusChip id={s.id} entry={statusOf(statuses, s.id)} />
        </section>
      )}
      {s.note && (
        <section>
          <h4>{t.note}</h4>
          <p>{s.note}</p>
        </section>
      )}
      <section>
        <h4>{t.leadsTo}</h4>
        <div className="pd-insp__chips">{out.length ? out.map(chip) : <span className="pd-muted">—</span>}</div>
      </section>
      <section>
        <h4>{t.comesFrom}</h4>
        <div className="pd-insp__chips">{into.length ? into.map(chip) : <span className="pd-muted">—</span>}</div>
      </section>
      {inFlows.length > 0 && (
        <section>
          <h4>{t.inFlows}</h4>
          {inFlows.map(({ p, f }) => (
            <a key={`${p.key}${f.key}`} className="pd-insp__flow" href={`#/${mode === 'flows' ? 'flows' : 'board'}/${p.key}/${f.key}`}>
              <i className={`pd-path-dot pd-path--${f.path ?? 'happy'}`} /> <b>{f.key}</b> {f.name}
            </a>
          ))}
        </section>
      )}
      {s.requirements?.length ? (
        <section>
          <h4>{t.requirementsLabel}</h4>
          <p>{s.requirements.join(', ')}</p>
        </section>
      ) : null}
      {parts.length > 0 && (
        <section>
          <h4>{t.builtWith}</h4>
          <div className="pd-insp__chips">
            {parts.map((c) => (
              <a key={c} className="pd-mini-chip" href={`#/ds/${c}`}>
                {c}
              </a>
            ))}
          </div>
        </section>
      )}
      <p className="pd-insp__meta">
        {vp.label} · {vp.width}×{vp.height} · <code>{s.file}</code>
      </p>
      {mode !== 'prototype' && (
        <a className="pd-btn pd-btn--primary pd-insp__open" href={screenHash(s.id)}>
          {t.openPrototype}
        </a>
      )}
    </div>
  );
};

const ViewOptionsPanel = ({ mode }: { mode: Mode }) => {
  const { options, setOptions } = useShell();
  const t = useT();

  return (
    <section className="pd-insp pd-insp--options">
      <h4>{t.view}</h4>
      {mode === 'prototype' ? (
        <p className="pd-muted">{t.prototypeHint}</p>
      ) : (
        <>
          <label className="pd-field">
            <span>{t.status}</span>
            <select className="pd-select" value={options.statusFilter} onChange={(e) => setOptions({ statusFilter: e.target.value as Status | '' })}>
              <option value="">{t.any}</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t.statusLabels[st]}
                </option>
              ))}
            </select>
          </label>
          {mode === 'board' && (
            <label className="pd-toggle">
              <input type="checkbox" checked={options.showClosed} onChange={(e) => setOptions({ showClosed: e.target.checked })} /> {t.versions}
            </label>
          )}
          {mode === 'flows' && (
            <label className="pd-toggle">
              <input type="checkbox" checked={options.showOther} onChange={(e) => setOptions({ showOther: e.target.checked })} /> {t.showOther}
            </label>
          )}
          <label className="pd-toggle">
            <input type="checkbox" checked={options.wheelZooms} onChange={(e) => setOptions({ wheelZooms: e.target.checked })} /> {t.wheelZooms}
          </label>
          <p className="pd-muted pd-insp__hint">{t.selectHint}</p>
        </>
      )}
    </section>
  );
};

// ---------------------------------------------------------------- island

const Island = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { canvas, selected } = useShell();
  const zoom = useZoom();
  const t = useT();
  const flow = page?.flows.find((f) => f.key === flowKey);
  const suffix = page ? `/${page.key}${flow ? `/${flow.key}` : ''}` : '';
  const firstScreen = selected ?? flow?.screens[0] ?? page?.flows[0]?.screens[0];
  const canZoom = mode === 'board' || mode === 'flows';

  return (
    <div className="pd-island" data-pd-ui role="toolbar" aria-label={t.modes}>
      <div className="pd-island__modes">
        <a className={mode === 'board' ? 'is-on' : ''} href={`#/board${suffix}`}>
          {t.board}
        </a>
        <a className={mode === 'flows' ? 'is-on' : ''} href={`#/flows${suffix}`}>
          {t.flows}
        </a>
        <a className={mode === 'prototype' ? 'is-on' : ''} href={firstScreen ? screenHash(firstScreen) : '#/'}>
          {t.prototype}
        </a>
      </div>
      {canZoom && (
        <div className="pd-island__zoom">
          <button type="button" onClick={() => canvas.current?.zoomBy(0.8)} aria-label={t.zoomOut}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => canvas.current?.zoomBy(1.25)} aria-label={t.zoomIn}>
            +
          </button>
          <button type="button" onClick={() => canvas.current?.fit()}>
            {t.fit}
          </button>
        </div>
      )}
    </div>
  );
};
