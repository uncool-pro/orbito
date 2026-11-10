import { useEffect, useRef, useState } from 'react';

import { DS_LEVELS, flowStatusId, screenName, statusOf } from '@uncool-pro/orbito-core';
import type { Page } from '@uncool-pro/orbito-core';

import { useT } from '../../i18n';
import { recall, remember } from '../../remembered';
import { useStatuses } from '../../status';
import { useViewer } from '../context';
import { canvasHash, canvasOf, dsHash, go, lastCanvasHash, openScreen, pickScreen } from '../routes';
import type { Mode } from '../routes';
import { useShell } from './state';
import { Icon } from '../icons';

/** The two tabs are the two places of the tool: the project (board, flows, prototype) and the design-system catalog. A tab
 * opens its place, not only its tree: Design system opens the catalog, Project leads back to the board or flows you left. */
export const Drawer = ({ mode, page, flowKey, dsSection }: { mode: Mode; page?: Page; flowKey?: string; dsSection?: string }) => {
  const t = useT();
  const tab = mode === 'ds' ? 'ds' : 'project';
  const setTab = (to: 'project' | 'ds') => {
    if (to === tab) return;
    go(to === 'ds' ? dsHash() : lastCanvasHash());
  };

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
      <div className={tab === 'project' ? 'pd-drawer__body pd-drawer__body--project' : 'pd-drawer__body'}>{tab === 'project' ? <ProjectTree mode={mode} page={page} flowKey={flowKey} /> : <DsTree section={dsSection} />}</div>
    </aside>
  );
};

/** One disclosure icon for every level of the tree: a chevron that turns down when the level is open. */
const Chevron = ({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) => (
  <button type="button" className={`pd-tree__chevron${open ? ' is-open' : ''}`} aria-expanded={open} aria-label={label} onClick={onClick}>
    <Icon name="chevron-right" size={15} />
  </button>
);

const BranchIcon = () => <Icon name="git-branch" size={14} className="pd-tree__icon" />;

/**
 * The project, as in Figma: a small list of the pages on top (it scrolls on its own when there are many), and under it
 * the features of the page you are on, each opening into its screens. Every row has the same shape: a chevron (or its
 * space), the name first, the code small and grey after it. A feature shows its path as the line of the flows legend and
 * its status as the only dot. A page's name shows the whole page; a feature shows only that feature, and a second click
 * on it the whole page again.
 */
/** One page row (32 px) and the 1 px between rows. */
const PAGE_ROW = 33;
const PAGES_HEIGHT = 'pd.pagesHeight';

/**
 * The height of the pages list: five and a half rows by default (the cut row says it scrolls), dragged by its bottom
 * edge or set with the arrow keys on it, from two rows to all of them. Remembered on this computer.
 */
const usePagesHeight = (count: number) => {
  const [height, setHeight] = useState<number | null>(() => {
    const saved = Number(recall(PAGES_HEIGHT));

    return saved > 0 ? saved : null;
  });
  const set = (h: number) => {
    // n rows are n × 32 px and n − 1 gaps
    const next = Math.round(Math.min(Math.max(count, 2) * PAGE_ROW - 1, Math.max(2 * PAGE_ROW - 1, h)));

    setHeight(next);
    remember(PAGES_HEIGHT, String(next));
  };

  return [height, set] as const;
};

const ProjectTree = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { project, screens: byId } = useViewer();
  const { selected, select } = useShell();
  const statuses = useStatuses();
  const t = useT();
  const base = canvasOf(mode);
  const [pagesHeight, setPagesHeight] = usePagesHeight(project.pages.length);
  const pagesList = useRef<HTMLUListElement>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);
  const listHeight = () => pagesList.current?.getBoundingClientRect().height ?? 0;
  const [open, setOpen] = useState<Set<string>>(() => new Set(flowKey ? [flowKey] : page?.flows.slice(0, 2).map((f) => f.key)));
  const toggle = (key: string) => setOpen((o) => (o.has(key) ? new Set([...o].filter((k) => k !== key)) : new Set([...o, key])));

  useEffect(() => {
    if (flowKey) setOpen((o) => new Set([...o, flowKey]));
  }, [flowKey]);

  // one highlight at a time: a selected screen that shows in the tree is the highlight, not its feature as well
  const selectedShown =
    !!selected && !!page?.flows.some((f) => open.has(f.key) && (f.screens.includes(selected) || (f.versions ?? []).some((v) => v.screens.some((vs) => vs.id === selected))));

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
          <span className="pd-tree__name">{screenName(s)}</span>
          {s.code && <small className="pd-tree__code">{s.code}</small>}
        </button>
      </li>
    );
  };

  return (
    <>
      <nav className="pd-pages" aria-label={t.pages}>
        <h4>{t.pages}</h4>
        <ul className="pd-pages__list" ref={pagesList} style={pagesHeight ? { maxHeight: `min(${pagesHeight}px, 50vh)` } : undefined}>
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
        {project.pages.length > 2 && (
          <div
            className="pd-pages__grip"
            role="separator"
            aria-orientation="horizontal"
            aria-label={t.resizePages}
            title={t.resizePages}
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { y: e.clientY, h: listHeight() };
            }}
            onPointerMove={(e) => {
              if (drag.current) setPagesHeight(drag.current.h + e.clientY - drag.current.y);
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              setPagesHeight(listHeight() + (e.key === 'ArrowDown' ? PAGE_ROW : -PAGE_ROW));
            }}
          />
        )}
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
                      className={`pd-tree__row pd-tree__flow${on && !selectedShown ? ' is-on' : ''}`}
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
      <h4>{t.foundations}</h4>
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
