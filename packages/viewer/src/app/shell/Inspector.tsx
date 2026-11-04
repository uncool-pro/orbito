import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import { featureOf, groupTargets, sharedTargets, targetsOf } from '@uncool-pro/orbito-core';
import type { Flow, Page, Screen } from '@uncool-pro/orbito-core';

import { LiveScreen } from '../../board/BoardCard';
import { CodePanel } from '../CodePanel';
import { CommentsLine } from '../Comments';
import { openInEditor, pathOnComputer, revealFile, useDevEnv, vscodeLink } from '../../dev';
import { useT } from '../../i18n';
import { useViewer } from '../context';
import { canvasHash, canvasOf, dsHash, pickScreen, screenHash } from '../routes';
import type { Mode } from '../routes';
import { useInspectorExtra, useShell } from './state';
import { Icon } from '../icons';

/** The right panel answers by mode: product mode, what the screen is and what was agreed on it; dev mode, its code. */
export const Inspector = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { selected, devMode } = useShell();
  const t = useT();
  const { project } = useViewer();
  const extra = useInspectorExtra();
  const s = selected ? project.screens.find((x) => x.id === selected) : undefined;

  if (s && devMode)
    return (
      <aside className="pd-inspector pd-inspector--code" data-pd-ui aria-label={t.code}>
        <DevInspector screen={s} />
      </aside>
    );

  return (
    <aside className="pd-inspector" data-pd-ui aria-label={t.details}>
      {s ? (
        <ScreenInspector key={s.id} screen={s} mode={mode} page={page} flowKey={flowKey} />
      ) : (
        <>
          {mode !== 'prototype' && extra}
          <p className="pd-muted pd-insp__hint">{mode === 'prototype' ? t.prototypeHint : t.selectHint}</p>
        </>
      )}
    </aside>
  );
};

/**
 * What a person looking at a screen asks first: what it is, which features it belongs to, what the team said about it and
 * where it leads within the feature. Ways out to other features fold into one line, the menu shows once, and everything
 * for developers waits in dev mode.
 */
const ScreenInspector = ({ screen: s, mode, page, flowKey }: { screen: Screen<ComponentType>; mode: Mode; page?: Page; flowKey?: string }) => {
  const { project, links, ds } = useViewer();
  const { select, togglePanel } = useShell();
  const t = useT();
  const vp = project.viewports[s.viewport ?? project.config.defaultViewport]!;
  const scale = Math.min(236 / vp.width, 300 / vp.height);
  const frame = { x: 0, y: 0, w: Math.round(vp.width * scale), h: Math.round(vp.height * scale), scale };
  const out = links ? targetsOf(links, s.id) : [];
  const into = links ? Object.keys(links).filter((id) => targetsOf(links, id).includes(s.id)) : [];
  const inFlows = project.pages.flatMap((p) => p.flows.filter((f) => f.screens.includes(s.id)).map((f) => ({ p, f })));
  const parts = ds.report.screens[s.id] ?? [];
  // the feature the screen is seen in: the one open on the canvas, or the first on its page that lists it
  const open = page?.flows.find((f) => f.key === flowKey);
  const feature = open?.screens.includes(s.id) ? open : page ? featureOf(page, s.id) : undefined;

  return (
    <div className="pd-insp">
      <div className="pd-insp__head">
        <b>{s.title.split(' / ').pop()}</b>
        {/* hides the panel (the same as the button in the top bar); the selection stays, so the details come back */}
        <button type="button" className="pd-iconbtn pd-iconbtn--sm" onClick={() => togglePanel('inspector')} aria-label={t.hidePanel} title={t.hidePanel}>
          <Icon name="panel-right" size={18} />
        </button>
      </div>
      <p className="pd-insp__title">
        {s.title} <small>{s.code}</small>
      </p>
      {mode !== 'prototype' && (
        <div className="pd-insp__preview" style={{ width: frame.w, height: frame.h }}>
          <LiveScreen screen={s} viewport={vp} card={{ frame }} />
        </div>
      )}
      {s.note && (
        <section>
          <h4>{t.note}</h4>
          <p>{s.note}</p>
        </section>
      )}
      {inFlows.length > 0 && (
        <section>
          <h4>{t.inFlows}</h4>
          {inFlows.map(({ p, f }) => (
            <a key={`${p.key}${f.key}`} className="pd-insp__flow" href={canvasHash(canvasOf(mode), p.key, f.key)}>
              <i className={`pd-pathmark pd-path--${f.path ?? 'happy'}`} /> {f.name} <small className="pd-tree__code">{f.key}</small>
            </a>
          ))}
        </section>
      )}
      <CommentsLine screen={s} />
      <Connections title={t.leadsTo} ids={out} mode={mode} page={page} feature={feature} onPick={(id) => pickScreen(mode, id, select)} />
      <Connections title={t.comesFrom} ids={into} mode={mode} page={page} feature={feature} onPick={(id) => pickScreen(mode, id, select)} />
      <Requirements ids={s.requirements?.length ? s.requirements : (feature?.requirements ?? [])} ofFeature={!s.requirements?.length} />
      {parts.length > 0 && (
        <section>
          <h4>{t.builtWith}</h4>
          <div className="pd-insp__chips">
            {parts.map((c) => (
              <a key={c} className="pd-mini-chip" href={dsHash(c)}>
                {c}
              </a>
            ))}
          </div>
        </section>
      )}
      <p className="pd-insp__meta">
        {s.viewports && s.viewports.length > 1
          ? `${t.responsive}: ${s.viewports.map((k) => project.viewports[k]?.label ?? k).join(' · ')}`
          : `${vp.label} · ${vp.width}×${vp.height}`}
      </p>
      <ClaudeRef screen={s} />
      {mode !== 'prototype' && (
        <a className="pd-btn pd-btn--primary pd-insp__open" href={screenHash(s.id)}>
          {t.openPrototype}
        </a>
      )}
    </div>
  );
};

/** Ways in or out of a screen, in the three kinds a person reads differently: this feature, other features (folded), the menu (once). */
const Connections = ({ title, ids, mode, page, feature, onPick }: { title: string; ids: string[]; mode: Mode; page?: Page; feature?: Flow; onPick: (id: string) => void }) => {
  const { project, links } = useViewer();
  const t = useT();
  const [open, setOpen] = useState(false);
  const shared = useMemo(() => (links ? sharedTargets(links) : new Set<string>()), [links]);
  const byId = useMemo(() => new Map(project.screens.map((x) => [x.id, x])), [project]);
  const g = groupTargets(ids, { page, feature, shared });
  const others = g.elsewhere.reduce((n, e) => n + e.ids.length, 0);
  const name = (id: string) => byId.get(id)?.title.split(' / ').pop() ?? id;
  const chip = (id: string) => (
    <button key={id} type="button" className="pd-mini-chip" onClick={() => onPick(id)}>
      {name(id)} <small>{byId.get(id)?.code}</small>
    </button>
  );

  return (
    <section>
      <h4>{title}</h4>
      <div className="pd-insp__chips">{g.here.length ? g.here.map(chip) : <span className="pd-muted">{ids.length ? t.noneInFeature : '—'}</span>}</div>
      {others > 0 && (
        <button type="button" className="pd-insp__more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {t.elsewhereCount(others, g.elsewhere.length)}
        </button>
      )}
      {open &&
        g.elsewhere.map((e) => (
          <div key={e.feature?.key ?? '-'} className="pd-insp__group">
            {e.feature && page ? (
              <a className="pd-insp__flow" href={canvasHash(canvasOf(mode), page.key, e.feature.key)}>
                <i className={`pd-pathmark pd-path--${e.feature.path ?? 'happy'}`} /> {e.feature.name} <small className="pd-tree__code">{e.feature.key}</small>
              </a>
            ) : (
              <small className="pd-muted">{t.otherPages}</small>
            )}
            <div className="pd-insp__chips">{e.ids.map(chip)}</div>
          </div>
        ))}
      {g.shared.length > 0 && (
        <p className="pd-insp__shared">
          {t.sharedNav}: {g.shared.map(name).join(' · ')}
        </p>
      )}
    </section>
  );
};

/**
 * The functional requirements the screen implements (or, when it names none, those of its feature), with their text as
 * the tracker has it: the story and its acceptance criteria open under the title. An id with no story in
 * `requirements/` shows as the bare id.
 */
const Requirements = ({ ids, ofFeature }: { ids: string[]; ofFeature: boolean }) => {
  const { requirements } = useViewer();
  const t = useT();

  if (!ids.length) return null;

  return (
    <section className="pd-insp__reqs">
      <h4>{ofFeature ? t.featureRequirements : t.requirementsLabel}</h4>
      {ids.map((id) => {
        const r = requirements.get(id);

        return r ? (
          <details key={id} className="pd-req">
            <summary>
              <b>{r.id}</b> {r.title}
              {r.status && <small className="pd-req__status">{r.status}</small>}
            </summary>
            {r.priority && (
              <p className="pd-req__meta">
                {t.priority}: {r.priority}
              </p>
            )}
            <p className="pd-req__text">{r.text}</p>
            <p className="pd-req__meta">{r.file}</p>
          </details>
        ) : (
          <p key={id} className="pd-req pd-req--missing" title={t.requirementMissing}>
            <b>{id}</b> <span className="pd-muted">{t.requirementMissing}</span>
          </p>
        );
      })}
    </section>
  );
};

const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (what: string, text: string) =>
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1400);
    });

  return { copied, copy };
};

/** Outside dev mode one thing stays for designers too: a reference to the screen to paste into the chat with Claude. */
const ClaudeRef = ({ screen: s }: { screen: Screen<ComponentType> }) => {
  const t = useT();
  const { copied, copy } = useCopy();

  return (
    <button type="button" className="pd-btn pd-btn--sm" title={t.copyForClaudeTip} onClick={() => copy('claude', t.claudeRef(s.title.split(' / ').pop() ?? s.id, s.code ?? '', s.file))}>
      {copied === 'claude' ? `✓ ${t.copied}` : t.copyForClaude}
    </button>
  );
};

/** Dev mode with a screen selected: where it lives, then its code and the code of its components, filling the panel. */
const DevInspector = ({ screen: s }: { screen: Screen<ComponentType> }) => {
  const { togglePanel } = useShell();
  const t = useT();

  return (
    <>
      <div className="pd-insp pd-insp--devhead">
        <div className="pd-insp__head">
          <b>
            {s.title.split(' / ').pop()} <small className="pd-insp__key">{s.code}</small>
          </b>
          <button type="button" className="pd-iconbtn pd-iconbtn--sm" onClick={() => togglePanel('inspector')} aria-label={t.hidePanel} title={t.hidePanel}>
            <Icon name="panel-right" size={18} />
          </button>
        </div>
        <DevSection screen={s} />
      </div>
      <CodePanel screen={s} />
    </>
  );
};

/**
 * Where the screen lives in code, for whoever builds it (dev mode): the path on this computer to copy, the file in the
 * editor, the file manager outside a container, and a reference for Claude.
 */
const DevSection = ({ screen: s }: { screen: Screen<ComponentType> }) => {
  const dev = useDevEnv();
  const t = useT();
  const { copied, copy } = useCopy();
  const full = pathOnComputer(dev, s.file);
  const name = s.title.split(' / ').pop() ?? s.id;

  return (
    <section className="pd-insp__dev">
      <h4>{t.devTitle}</h4>
      <div className="pd-insp__path">
        <code title={full ?? s.file}>{s.file}</code>
        <button type="button" className="pd-iconbtn pd-iconbtn--sm" onClick={() => copy('path', full ?? s.file)} aria-label={t.copyPath} title={t.copyPath}>
          <Icon name={copied === 'path' ? 'check' : 'copy'} size={14} />
        </button>
      </div>
      <div className="pd-insp__devbtns">
        {full && (
          <a className="pd-btn pd-btn--sm" href={vscodeLink(full)}>
            {t.openVsCode}
          </a>
        )}
        {dev && !dev.container && (
          <>
            <button type="button" className="pd-btn pd-btn--sm" onClick={() => void revealFile(s.file)}>
              {t.reveal(dev.platform)}
            </button>
            <button type="button" className="pd-btn pd-btn--sm" onClick={() => void openInEditor(dev, s.file)}>
              {t.openEditor}
            </button>
          </>
        )}
        <button type="button" className="pd-btn pd-btn--sm" title={t.copyForClaudeTip} onClick={() => copy('claude', t.claudeRef(name, s.code ?? '', s.file))}>
          {copied === 'claude' ? `✓ ${t.copied}` : t.copyForClaude}
        </button>
      </div>
    </section>
  );
};
