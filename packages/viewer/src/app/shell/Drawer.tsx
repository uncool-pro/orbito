import { useEffect, useState } from 'react';

import { DS_LEVELS, flowStatusId, statusOf } from '@uncool-pro/orbito-core';
import type { Page } from '@uncool-pro/orbito-core';

import { useT } from '../../i18n';
import { useStatuses } from '../../status';
import { useViewer } from '../context';
import { canvasHash, canvasOf, dsHash, openScreen, pickScreen } from '../routes';
import type { Mode } from '../routes';
import { useShell } from './state';

export const Drawer = ({ mode, page, flowKey, dsSection }: { mode: Mode; page?: Page; flowKey?: string; dsSection?: string }) => {
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

/** One disclosure icon for every level of the tree: a chevron that turns down when the level is open. */
const Chevron = ({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) => (
  <button type="button" className={`pd-tree__chevron${open ? ' is-open' : ''}`} aria-expanded={open} aria-label={label} onClick={onClick}>
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);

const BranchIcon = () => (
  <svg className="pd-tree__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M5 3v10M5 10c0-3 6-2 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="5" cy="3" r="1.6" fill="currentColor" />
    <circle cx="11" cy="4" r="1.6" fill="currentColor" />
    <circle cx="5" cy="13" r="1.6" fill="currentColor" />
  </svg>
);

/**
 * The project, as in Figma: a small list of the pages on top (it scrolls on its own when there are many), and under it
 * the features of the page you are on, each opening into its screens. Every row has the same shape: a chevron (or its
 * space), the name first, the code small and grey after it. A feature shows its path as the line of the flows legend and
 * its status as the only dot. A page's name shows the whole page; a feature shows only that feature, and a second click
 * on it the whole page again.
 */
const ProjectTree = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { project } = useViewer();
  const { selected, select } = useShell();
  const statuses = useStatuses();
  const t = useT();
  const base = canvasOf(mode);
  const byId = new Map(project.screens.map((s) => [s.id, s]));
  const [open, setOpen] = useState<Set<string>>(() => new Set(flowKey ? [flowKey] : page?.flows.slice(0, 2).map((f) => f.key)));
  const toggle = (key: string) => setOpen((o) => (o.has(key) ? new Set([...o].filter((k) => k !== key)) : new Set([...o, key])));

  useEffect(() => {
    if (flowKey) setOpen((o) => new Set([...o, flowKey]));
  }, [flowKey]);

  const row = (id: string, extra?: string) => {
    const s = byId.get(id);

    if (!s) return null;

    return (
      <li key={`${extra ?? ''}${id}`}>
        <button
          type="button"
          className={`pd-tree__row pd-tree__screen${selected === id ? ' is-on' : ''}`}
          onClick={() => pickScreen(mode, id, select)}
          onDoubleClick={() => openScreen(id)}
          title={s.title}
        >
          <span className="pd-tree__name">{s.title.split(' / ').pop()}</span>
          {s.code && <small className="pd-tree__code">{s.code}</small>}
        </button>
      </li>
    );
  };

  return (
    <>
      <nav className="pd-pages" aria-label={t.pages}>
        <h4>{t.pages}</h4>
        <ul className="pd-pages__list">
          {project.pages.map((p) => {
            const current = p.key === page?.key;

            return (
              <li key={p.key}>
                <a className={`pd-pages__page${current ? ' is-on' : ''}`} href={canvasHash(base, p.key)} aria-current={current ? 'page' : undefined}>
                  <span className="pd-tree__name">{p.name}</span>
                  <small className="pd-tree__code">{p.flows.length}</small>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      {page && (
        <nav className="pd-tree" aria-label={t.features}>
          <h4>{t.features}</h4>
          <ul className="pd-tree__level">
            {page.flows.map((f) => {
              const isOpen = open.has(f.key);
              const st = statusOf(statuses, flowStatusId(page.key, f.key)).status;
              const on = flowKey === f.key;

              return (
                <li key={f.key}>
                  <div className="pd-tree__line">
                    <Chevron open={isOpen} label={isOpen ? t.collapse : t.expand} onClick={() => toggle(f.key)} />
                    <a
                      className={`pd-tree__row pd-tree__flow${on ? ' is-on' : ''}`}
                      href={on ? canvasHash(base, page.key) : canvasHash(base, page.key, f.key)}
                      title={`${f.name} · ${t.pathKinds[f.path ?? 'happy']}${on ? ` · ${t.backToPage}` : ''}`}
                    >
                      <i className={`pd-pathmark pd-path--${f.path ?? 'happy'}`} />
                      <span className="pd-tree__name">{f.name}</span>
                      <small className="pd-tree__code">{f.key}</small>
                      <i className={`pd-dot pd-status--${st}`} title={t.statusLabels[st]} />
                    </a>
                  </div>
                  {isOpen && (
                    <ul className="pd-tree__level pd-tree__level--nested">
                      {f.screens.map((id, i) => row(id, `${f.key}${i}`))}
                      {(f.versions ?? []).map((v) => (
                        <li key={v.key} className="pd-tree__version">
                          <div className="pd-tree__row pd-tree__vlabel">
                            <BranchIcon />
                            <span className="pd-tree__name">{v.name}</span>
                            <small className="pd-tree__state">{v.state}</small>
                          </div>
                          <ul className="pd-tree__level pd-tree__level--nested">{v.screens.map((vs) => row(vs.id, `${f.key}/${v.key}`))}</ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
};

const DsTree = ({ section }: { section?: string }) => {
  const { ds } = useViewer();
  const t = useT();
  const { report } = ds;
  const issuesOf = (name: string) => report.issues.some((i) => i.component === name && i.severity !== 'info');

  return (
    <nav className="pd-tree" aria-label={t.designSystem}>
      <a className={`pd-tree__item${!section ? ' is-on' : ''}`} href={dsHash()}>
        {t.overview}
      </a>
      <a className={`pd-tree__item${section === 'health' ? ' is-on' : ''}`} href={dsHash('health')}>
        {t.health} {report.counts.error + report.counts.warning > 0 ? <span className="pd-count is-error">{report.counts.error + report.counts.warning}</span> : <span className="pd-count is-ok">✓</span>}
      </a>
      <h4>{t.tokens}</h4>
      {Object.keys(report.tokens).map((g) => (
        <a key={g} className={`pd-tree__item${section === `tokens/${g}` ? ' is-on' : ''}`} href={dsHash(`tokens/${g}`)}>
          {t.groups[g] ?? g} <small>{report.tokens[g]?.length}</small>
        </a>
      ))}
      {DS_LEVELS.map((level) => {
        const list = report.components.filter((c) => c.level === level);

        return list.length ? (
          <div key={level}>
            <h4>{t.levels[level]}</h4>
            {list.map((c) => (
              <a key={c.name} className={`pd-tree__item${section === c.name ? ' is-on' : ''}`} href={dsHash(c.name)}>
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
