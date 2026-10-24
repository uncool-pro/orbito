import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { computeLayout, flowStatusId, statusOf, STATUSES, targetsOf } from '@uncool-pro/orbito-core';
import type { Card, Page, Status } from '@uncool-pro/orbito-core';

import { setInspectorExtra, setZoom, useShell } from '../app/shell/state';
import { screenHash } from '@uncool-pro/orbito-runtime';

import { useViewer } from '../app/context';
import { useT } from '../i18n';
import { useStatuses } from '../status';
import { centerOn, fitRect, intersects, visibleWorld, zoomAt, zoomTo } from '../canvas/camera';
import type { Camera } from '../canvas/camera';
import { CanvasController } from '../canvas/controller';
import type { Scroller } from '../canvas/controller';
import { StatusChip } from '../app/StatusChip';
import { BoardCard } from './BoardCard';
import { useFindingTitles } from './findings';

const TOOLBAR_INSET = 16;
const MOUNT_MARGIN = 400; // screen px around the view in which cards get their live screen

const readView = (key: string): Camera | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Camera | null;

    return v && Number.isFinite(v.k) ? v : null;
  } catch {
    return null;
  }
};

export const Board = ({ page, flowKey }: { page: Page; flowKey?: string }) => {
  const { project, links } = useViewer();
  const t = useT();
  const statuses = useStatuses();
  const flows = useMemo(() => (flowKey ? page.flows.filter((f) => f.key === flowKey) : page.flows), [page, flowKey]);
  const { options, selected, select, focusTick, canvas } = useShell();
  const showClosed = options.showClosed;
  const byId = useMemo(() => new Map(project.screens.map((s) => [s.id, s])), [project]);
  const layout = useMemo(
    () => computeLayout({ flows, screens: byId, viewports: project.viewports, links: links ?? {}, showClosedVersions: showClosed }),
    [flows, byId, project.viewports, links, showClosed],
  );
  const findingTitles = useFindingTitles(flows);

  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const ctrl = useRef<CanvasController | null>(null);
  const prefsRef = useRef({ wheelZooms: options.wheelZooms });
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef(active);
  const [mounted, setMounted] = useState<Set<string>>(() => new Set());
  const mountedRef = useRef(mounted);
  const layoutRef = useRef(layout);
  const viewKey = `pd.view.${page.key}.${flowKey ?? '*'}`;

  prefsRef.current = { wheelZooms: options.wheelZooms };
  activeRef.current = active;
  layoutRef.current = layout;

  const viewSize = () => ({ w: root.current?.clientWidth ?? window.innerWidth, h: root.current?.clientHeight ?? window.innerHeight });
  /** First view: the board as wide as the canvas, from the top (fitting a tall board whole makes every screen tiny). */
  const fitWidth = useCallback(() => {
    const { w, h } = viewSize();
    const L = layoutRef.current;
    const k = Math.min(0.9, Math.max(0.2, (w - 48) / Math.max(1, L.w)));

    return L.h * k <= h - 80 ? fitRect({ x: 0, y: 0, w: L.w, h: L.h }, { w, h }, { inset: TOOLBAR_INSET, maxK: 0.9 }) : { k, x: (w - L.w * k) / 2, y: 24 };
  }, []);
  const fitAll = useCallback(
    () => fitRect({ x: 0, y: 0, w: layoutRef.current.w, h: layoutRef.current.h }, viewSize(), { inset: TOOLBAR_INSET, maxK: 1 }),
    [],
  );

  /** Cards near the view get their live screen; once mounted they stay (no remount churn while panning back and forth). */
  const mountVisible = useCallback((c: Camera) => {
    const view = visibleWorld(c, viewSize(), MOUNT_MARGIN);
    const add = layoutRef.current.cards.filter((card) => !mountedRef.current.has(card.key) && intersects(view, card));

    if (!add.length) return;
    mountedRef.current = new Set([...mountedRef.current, ...add.map((card) => card.key)]);
    setMounted(mountedRef.current);
  }, []);

  // the camera lives outside React: one transform write per animation frame, no re-render while moving
  useLayoutEffect(() => {
    const el = root.current!;
    let saveTimer = 0;
    const controller: CanvasController = new CanvasController(el, {
      initial: readView(viewKey) ?? fitWidth(),
      onChange: (c) => {
        world.current!.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.k})`;
        el.style.backgroundSize = `${24 * c.k}px ${24 * c.k}px`;
        el.style.backgroundPosition = `${c.x}px ${c.y}px`;
        setZoom(c.k);
        mountVisible(c);
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
          try {
            sessionStorage.setItem(viewKey, JSON.stringify(c));
          } catch {
            /* storage unavailable */
          }
        }, 250);
      },
      scrollerAt: (target): Scroller | null => {
        const key = activeRef.current;
        const cardEl = target.closest<HTMLElement>('[data-card]');

        if (!key || cardEl?.dataset.card !== key) return null;
        const card = layoutRef.current.cards.find((c) => c.key === key);
        const candidates = [...cardEl.querySelectorAll<HTMLElement>('[data-pd-scroll], [data-pd-page-scroll]')];
        const sc = candidates.find((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1);

        return sc && card ? { el: sc, scale: controller.camera.k * card.frame.scale } : null;
      },
      isUi: (target) => !!target.closest('[data-pd-ui]'),
      prefs: () => prefsRef.current,
    });

    ctrl.current = controller;
    controller.set(controller.camera);
    canvas.current = {
      zoomBy: (f) => {
        const { w, h } = viewSize();

        controller.set(zoomAt(controller.camera, f, w / 2, h / 2));
      },
      fit: () => controller.set(fitAll()),
    };
    // a board opened in a hidden tab has no size yet: fit once it gets one (unless the user already moved)
    let ro: ResizeObserver | null = null;

    if (!readView(viewKey) && (el.clientWidth === 0 || el.clientHeight === 0)) {
      ro = new ResizeObserver(() => {
        if (!el.clientWidth || !el.clientHeight) return;
        ro?.disconnect();
        ro = null;
        if (!controller.consumeDrag()) controller.set(fitWidth());
      });
      ro.observe(el);
    }

    return () => {
      ro?.disconnect();
      window.clearTimeout(saveTimer);
      controller.destroy();
      ctrl.current = null;
      canvas.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, fitAll, fitWidth, mountVisible]);

  // new cards (closed versions shown) may appear in view
  useEffect(() => {
    if (ctrl.current) mountVisible(ctrl.current.camera);
  }, [layout, mountVisible]);

  // ---- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const c = ctrl.current;

      if (!c) return;
      const { w, h } = viewSize();

      if (e.key === 'Escape') {
        setActive(null);
        select(null);
      }
      else if (e.shiftKey && e.code === 'Digit1') c.set(fitAll());
      else if (e.shiftKey && e.code === 'Digit0') c.set(zoomTo(c.camera, 1, w / 2, h / 2));
      else if (e.key === '+' || e.key === '=') c.set(zoomAt(c.camera, 1.25, w / 2, h / 2));
      else if (e.key === '-') c.set(zoomAt(c.camera, 0.8, w / 2, h / 2));
      else return;
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [fitAll, select]);

  // a screen picked in the left panel or the search: bring its first card into view
  useEffect(() => {
    const c = selected ? layoutRef.current.cards.find((x) => x.screenId === selected) : undefined;

    if (c && ctrl.current && focusTick) ctrl.current.set(centerOn(ctrl.current.camera, c, viewSize(), 0.7));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  // ---- clicks: a click on a screen starts the prototype from that screen (the fastest way to follow its interactions);
  // a click on the empty board clears the selection; never after a drag
  const onClick = (e: React.MouseEvent) => {
    if (ctrl.current?.consumeDrag()) return;
    const target = e.target as Element;

    if (target.closest('[data-pd-ui]')) return;
    const card = target.closest<HTMLElement>('[data-card]');

    if (card?.dataset.screen) {
      select(card.dataset.screen);
      window.location.hash = screenHash(card.dataset.screen);

      return;
    }
    setActive(null);
    select(null);
  };

  // ---- highlight
  const [hover, setHover] = useState<{ card?: string; edge?: string }>({});
  const statusFilter = options.statusFilter;
  const related = useMemo(() => {
    const edge = hover.edge ? layout.edges.find((e) => e.id === hover.edge) : undefined;

    if (edge) return new Set([edge.from, edge.to]);
    const card = hover.card ? layout.cards.find((c) => c.key === hover.card) : undefined;

    if (!card || !links) return null;
    const set = new Set([card.screenId, ...targetsOf(links, card.screenId)]);

    Object.keys(links).forEach((id) => targetsOf(links, id).includes(card.screenId) && set.add(id));

    return set;
  }, [hover, layout, links]);
  // statuses belong to features (flows); a card takes the status of the flow its lane shows
  const flowOfLane = useMemo(() => new Map(layout.lanes.map((l) => [l.key, l.flowKey])), [layout.lanes]);
  const flowStatus = (flowKey: string) => statusOf(statuses, flowStatusId(page.key, flowKey));
  // people read names, not codes: the functional name of a screen, and the feature a way out leads to
  const nameOf = (id: string) => byId.get(id)?.title.split(' / ').pop() ?? id;
  // a screen of the same feature is named by the screen; any other way out by the feature it opens ("arrow to a section")
  const exitsOf = (targets: string[], flowKey?: string) =>
    [
      ...new Set(
        targets.map((id) => {
          if (page.flows.find((f) => f.key === flowKey)?.screens.includes(id)) return nameOf(id);
          const inPage = page.flows.find((f) => f.screens.includes(id));
          if (inPage) return inPage.name;
          const elsewhere = project.pages.flatMap((p) => p.flows.map((f) => ({ p, f }))).find(({ f }) => f.screens.includes(id));

          return elsewhere ? `${elsewhere.p.name} · ${elsewhere.f.name}` : nameOf(id);
        }),
      ),
    ];
  const flowOfCard = (key: string) => {
    const card = layout.cards.find((c) => c.key === key);

    return card && flowOfLane.get(card.laneKey);
  };
  const cardState = (c: Card): 'idle' | 'hl' | 'dim' => {
    if (statusFilter && flowStatus(flowOfLane.get(c.laneKey) ?? c.laneKey).status !== statusFilter) return 'dim';
    if (related) return related.has(c.screenId) ? 'hl' : 'dim';
    if (selected) return selected === c.screenId ? 'hl' : 'idle';

    return 'idle';
  };
  const hoveredEdge = hover.edge ? layout.edges.find((e) => e.id === hover.edge) : undefined;

  const counts = useMemo(() => {
    const n = new Map<Status, number>();

    page.flows.forEach((f) => {
      const st = statusOf(statuses, flowStatusId(page.key, f.key)).status;

      n.set(st, (n.get(st) ?? 0) + 1);
    });

    return n;
  }, [page, statuses]);

  // the inspector shows the page summary when nothing is selected
  const screensCount = new Set(layout.cards.map((c) => c.screenId)).size;

  useEffect(() => {
    setInspectorExtra(
      <section className="pd-insp">
        <h4>{t.summary}</h4>
        <p className="pd-muted">{links ? t.featuresSummary(page.flows.length, screensCount) : t.detecting}</p>
        <ul className="pd-insp__features">
          {page.flows.map((f) => (
            <li key={f.key}>
              <a href={`#/board/${page.key}/${f.key}`}>
                <b>{f.key}</b> {f.name}
              </a>
              <StatusChip id={flowStatusId(page.key, f.key)} entry={flowStatus(f.key)} />
            </li>
          ))}
        </ul>
        <ul className="pd-insp__counts">
          {STATUSES.filter((st) => counts.get(st)).map((st: Status) => (
            <li key={st}>
              <i className={`pd-dot pd-status--${st}`} /> {t.statusLabels[st]} <b>{counts.get(st)}</b>
            </li>
          ))}
        </ul>
      </section>,
    );

    return () => setInspectorExtra(null);
  }, [counts, screensCount, links, t, page, statuses]);

  return (
    <div
      ref={root}
      className="pd-board"
      onClick={onClick}
      onPointerOver={(e) => {
        const card = (e.target as Element).closest<HTMLElement>('[data-card]')?.dataset.card;

        setHover((h) => (h.edge || h.card === card ? h : { card }));
      }}
      onPointerLeave={() => setHover({})}
    >
      {flows.length === 0 && <div className="pd-empty">{t.noFlows}</div>}

      <div ref={world} className="pd-world" style={{ width: layout.w, height: layout.h }}>
        {layout.lanes.map((l) => (
          <div key={l.key} className={`pd-lane${l.version ? ' pd-lane--version' : ''}`} style={{ top: l.y, width: l.w, height: l.h }}>
            <div className="pd-lane__label">
              {l.version ? (
                <>
                  <b>
                    {l.flowKey} · {l.version.name}
                  </b>
                  <small>
                    {l.version.date} · {l.version.state}
                  </small>
                </>
              ) : (
                <>
                  <b>{l.key}</b>
                  <span>{l.name}</span>
                  <small>{t.cards(l.cards.length)}</small>
                  <StatusChip id={flowStatusId(page.key, l.flowKey)} entry={flowStatus(l.flowKey)} />
                </>
              )}
            </div>
          </div>
        ))}
        {layout.cards.map((c) => {
          const s = byId.get(c.screenId)!;

          return (
            <BoardCard
              key={c.key}
              card={c}
              screen={s}
              viewport={project.viewports[s.viewport ?? project.config.defaultViewport]!}
              live={mounted.has(c.key)}
              state={cardState(c)}
              active={active === c.key}
              findingTitles={findingTitles[c.laneKey]}
            />
          );
        })}
        <svg className="pd-svg" width={layout.w} height={layout.h}>
          <defs>
            {['', '-hl', '-tie'].map((v) => (
              <marker key={v} id={`pd-arrow${v}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className={`pd-arrow${v}`} />
              </marker>
            ))}
          </defs>
          {layout.ties.map((tie) => (
            <path key={tie.id} d={tie.d} className="pd-tie" markerEnd="url(#pd-arrow-tie)" />
          ))}
          {layout.edges.map((e) => {
            const on = hover.edge === e.id || (!!hover.card && (e.fromCard === hover.card || e.toCard === hover.card));
            const faded = !!related && !on;

            return (
              <g key={e.id} className={`pd-edge pd-edge--${e.kind}${on ? ' is-on' : ''}${faded ? ' is-faded' : ''}`}>
                <path d={e.d} className="pd-edge__hit" onPointerEnter={() => setHover({ edge: e.id })} onPointerLeave={() => setHover({})} />
                <path d={e.d} className="pd-edge__line" markerEnd={`url(#pd-arrow${on ? '-hl' : e.kind === 'outer' ? '-tie' : ''})`} />
              </g>
            );
          })}
          {layout.stubs.map((s) => {
            const on = hover.card === s.cardKey;

            // quiet by default (an arrow and how many ways out); the names show on hover — a way into another
            // feature is named by that feature, not by a screen code
            return (
              <g key={s.cardKey} className={`pd-stub${on ? ' is-on' : ''}`}>
                <path d={`M${s.x} ${s.y + 2} L${s.x} ${s.y + 22}`} markerEnd="url(#pd-arrow-tie)" />
                {on ? (
                  exitsOf(s.targets, flowOfCard(s.cardKey)).map((label, i) => (
                    <text key={label} x={s.x} y={s.y + 40 + i * 18} textAnchor="middle">
                      → {label}
                    </text>
                  ))
                ) : (
                  <text x={s.x} y={s.y + 38} textAnchor="middle" className="pd-stub__count">
                    {s.targets.length}
                  </text>
                )}
              </g>
            );
          })}
          {hoveredEdge && (
            <g className="pd-edge-label" transform={`translate(${hoveredEdge.mid.x} ${hoveredEdge.mid.y})`}>
              <text textAnchor="middle" y={-8}>
                {hoveredEdge.label ? `“${hoveredEdge.label}” → ` : '→ '}
                {nameOf(hoveredEdge.to)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
