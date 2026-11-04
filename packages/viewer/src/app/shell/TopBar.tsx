import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import type { Page, Screen } from '@uncool-pro/orbito-core';

import { OrbitoWordmark } from '../Logo';
import { useT } from '../../i18n';
import { useViewer } from '../context';
import { canvasHash, canvasOf, dsHash, go, lastCanvasHash, openScreen, parseRoute, SKILLS_HASH } from '../routes';
import type { Mode } from '../routes';
import { useShell } from './state';
import { isPage, pageOfScreen } from './common';
import { Icon } from '../icons';

export const TopBar = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { project, problems, ds } = useViewer();
  const { togglePanel, devMode, toggleDev } = useShell();
  const t = useT();
  const flow = page?.flows.find((f) => f.key === flowKey);
  const issues = problems.length + ds.report.counts.error + ds.report.counts.warning;
  const base = canvasOf(mode);

  return (
    <header className="pd-top" data-pd-ui>
      <button type="button" className="pd-iconbtn" onClick={() => togglePanel('drawer')} aria-label={t.toggleDrawer} title={t.toggleDrawer}>
        <Icon name="panel-left" size={18} />
      </button>
      {/* the tool's logo, always the whole wordmark */}
      <a className="pd-brand" href={canvasHash('board')} title="Orbito">
        <OrbitoWordmark className="pd-wordmark" />
      </a>
      <nav className="pd-crumbs" aria-label={t.location}>
        <a className="pd-crumbs__project" href={canvasHash('board')}>
          {project.config.title}
        </a>
        {mode === 'ds' || mode === 'skills' ? (
          <>
            <span>/</span>
            <a href={mode === 'ds' ? dsHash() : SKILLS_HASH}>{mode === 'ds' ? t.designSystem : t.skills}</a>
          </>
        ) : (
          page && (
            <>
              <span>/</span>
              <a href={canvasHash(base, page.key)}>{page.name}</a>
              {flow && (
                <>
                  <span>/</span>
                  <a href={canvasHash(base, page.key, flow.key)}>
                    <b>{flow.key}</b> {flow.name}
                  </a>
                </>
              )}
            </>
          )
        )}
      </nav>
      {/* a toggle: on the skills map, the same link takes you back to where you were */}
      <a
        className={`pd-topnav${mode === 'skills' ? ' is-on' : ''}`}
        href={mode === 'skills' ? lastCanvasHash() : SKILLS_HASH}
        aria-current={mode === 'skills' ? 'page' : undefined}
        title={mode === 'skills' ? t.closeSkills : undefined}
      >
        {t.skills}
      </a>
      <ModelsBadge />
      <Search mode={mode} />
      <a className={`pd-health-pill${issues ? ' is-warn' : ''}`} href={dsHash('health')} title={t.health}>
        {issues ? `${issues} ${t.issuesShort}` : `✓ ${t.health}`}
      </a>
      {!isPage(mode) && (
        // Dev mode is on or off: a switch, its state readable from its position
        <button type="button" role="switch" className={`pd-devtoggle${devMode ? ' is-on' : ''}`} aria-checked={devMode} onClick={toggleDev} title={t.devModeTip}>
          {t.devMode}
          <span className="pd-devtoggle__track" aria-hidden="true" />
        </button>
      )}
      {!isPage(mode) && (
        <button type="button" className="pd-iconbtn" onClick={() => togglePanel('inspector')} aria-label={t.toggleInspector} title={t.toggleInspector}>
          <Icon name="panel-right" size={18} />
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
      <a className={`pd-models__pill is-${mode}`} href={SKILLS_HASH} aria-describedby="pd-models-tip">
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

  const openResult = (s: Screen<ComponentType>) => {
    const p = pageOfScreen(project, s.id);

    setQ('');
    setOpen(false);
    input.current?.blur();
    if (mode === 'prototype' || !p) return openScreen(s.id);
    select(s.id, { focus: true });
    const route = parseRoute(window.location.hash);

    if (!('page' in route) || route.page !== p.key) go(canvasHash(canvasOf(mode), p.key));
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
          if (e.key === 'Enter' && results[0]) openResult(results[0]);
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
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openResult(s)}>
                <b>{s.code ?? s.id}</b> {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
