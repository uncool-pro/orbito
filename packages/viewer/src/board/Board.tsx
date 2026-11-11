import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { computeLayout, flowStatusId, groupTargets, statusOf, STATUSES, targetsOf } from '@uncool-pro/orbito-core';
import type { Card, Page, Status } from '@uncool-pro/orbito-core';

import { setInspectorExtra, setZoom, useShell } from '../app/shell/state';

import { useViewer } from '../app/context';
import { useT } from '../i18n';
import { createIntent } from '../app/intent';
import { isTextField } from '../dom';
import { useStatuses } from '../status';
import { centerOn, fitRect, visibleWorld, zoomAt, zoomTo } from '../canvas/camera';
import type { Camera } from '../canvas/camera';
import { CanvasController } from '../canvas/controller';
import { placeWorld } from '../canvas/place';
import type { Scroller } from '../canvas/controller';
import { Measure } from '../app/Measure';
import { StatusChip } from '../app/StatusChip';
import { canvasHash, openScreen } from '../app/routes';
import { BoardCard } from './BoardCard';
import { useFindingTitles } from './findings';
import { liveCards, sameKeys } from './live';

const TOOLBAR_INSET = 16;
const MOUNT_MARGIN = 400; // screen px around the view in which cards get their live screen
const KEEP_VIEWS = 1; // …and keep it until they are this many views away

const readView = (key: string): Camera | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Camera | null;

    return v && Number.isFinite(v.k) ? v : null;
  } catch {
    return null;
  }
};
/** The size of the board on screen (the window's, before the board is in the page). */
const sizeOf = (el: HTMLElement | null) => ({
  w: el?.clientWidth ?? window.innerWidth,
  h: el?.clientHeight ?? window.innerHeight,
});

export const Board = ({ page, flowKey }: { page: Page; flowKey?: string }) => {
  const { project, links, sources, shared, screens: byId, nameOf } = useViewer();
  const t = useT();
  const statuses = useStatuses();
  const flows = useMemo(() => (flowKey ? page.flows.filter((f) => f.key === flowKey) : page.flows), [page, flowKey]);
  const {
    options,
    selected,
    select,
    focusTick,
    canvas,
    inspectorOpen,
    togglePanel,
    devMode,
    commentsOn,
    openComments,
  } = useShell();
  const showClosed = options.showClosed;
  const layout = useMemo(
    () =>
      computeLayout({
        flows,
        screens: byId,
        viewports: project.viewports,
        links: links ?? {},
        showClosedVersions: showClosed,
      }),
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

  /** First view: the board as wide as the canvas, from the top (fitting a tall board whole makes every screen tiny). */
  const fitWidth = useCallback(() => {
    const { w, h } = sizeOf(root.current);
    const L = layoutRef.current;
    const k = Math.min(0.9, Math.max(0.2, (w - 48) / Math.max(1, L.w)));

    return L.h * k <= h - 80
      ? fitRect({ x: 0, y: 0, w: L.w, h: L.h }, { w, h }, { inset: TOOLBAR_INSET, maxK: 0.9 })
      : { k, x: (w - L.w * k) / 2, y: 24 };
  }, []);
  const fitAll = useCallback(
    () =>
      fitRect({ x: 0, y: 0, w: layoutRef.current.w, h: layoutRef.current.h }, sizeOf(root.current), {
        inset: TOOLBAR_INSET,
        maxK: 1,
      }),
    [],
  );

  /** Cards near the view get their live screen and keep it until they are a whole view away (see `liveCards`). */
  const mountVisible = useCallback((c: Camera) => {
    const size = sizeOf(root.current);
    const near = visibleWorld(c, size, MOUNT_MARGIN);
    const far = visibleWorld(c, size, MOUNT_MARGIN + KEEP_VIEWS * Math.max(size.w, size.h));
    const live = liveCards(layoutRef.current.cards, mountedRef.current, near, far, activeRef.current);

    if (sameKeys(live, mountedRef.current)) return;
    mountedRef.current = live;
    setMounted(live);
  }, []);

  // the camera lives outside React: one transform write per animation frame, no re-render while moving
  useLayoutEffect(() => {
    const el = root.current!;
    let saveTimer = 0;
    const { place, release } = placeWorld(world.current!);
    const controller: CanvasController = new CanvasController(el, {
      initial: readView(viewKey) ?? fitWidth(),
      onChange: (c) => {
        place(c);
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
        const candidates = [...cardEl.querySelectorAll<HTMLElement>('[data-pd-scroll]')];
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
        const { w, h } = sizeOf(root.current);

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
      release();
      ctrl.current = null;
      canvas.current = null;
    };
  }, [viewKey, fitAll, fitWidth, mountVisible, canvas]);

  // new cards (closed versions shown) may appear in view
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs again when the layout changes; mountVisible reads it from a ref
  useEffect(() => {
    if (ctrl.current) mountVisible(ctrl.current.camera);
  }, [layout, mountVisible]);

  // ---- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTextField(e.target)) return;
      const c = ctrl.current;

      if (!c) return;
      const { w, h } = sizeOf(root.current);

      if (e.key === 'Escape') {
        setActive(null);
        select(null);
      } else if (e.shiftKey && e.code === 'Digit1') c.set(fitAll());
      else if (e.shiftKey && e.code === 'Digit0') c.set(zoomTo(c.camera, 1, w / 2, h / 2));
      else if (e.key === '+' || e.key === '=') c.set(zoomAt(c.camera, 1.25, w / 2, h / 2));
      else if (e.key === '-') c.set(zoomAt(c.camera, 0.8, w / 2, h / 2));
      else return;
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [fitAll, select]);

  // the active (scrollable) card is the clicked one while its screen stays selected; another selection ends it
  useEffect(() => {
    setActive((a) =>
      a && selected && layoutRef.current.cards.find((c) => c.key === a)?.screenId === selected ? a : null,
    );
  }, [selected]);

  // a screen picked in the left panel or the search: bring its first card into view
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a focus request moves the camera, a plain selection does not
  useEffect(() => {
    const c = selected ? layoutRef.current.cards.find((x) => x.screenId === selected) : undefined;

    if (c && ctrl.current && focusTick) ctrl.current.set(centerOn(ctrl.current.camera, c, sizeOf(root.current), 0.7));
  }, [focusTick]);

  // ---- clicks: a click on a screen selects it and shows its details on the right (in dev mode, its code), the same in
  // every mode; the prototype starts from ▶ above the screen or a double click; a click on the empty board clears the
  // selection; never after a drag
  /** The screen under the pointer, not the event target: whatever the browser picks as a click's target (a captured
   * pointer, an overlay), the screen the person clicked is the one under the pointer. */
  const cardAt = (e: React.MouseEvent) => {
    const target = (document.elementFromPoint(e.clientX, e.clientY) ?? e.target) as Element;

    return target.closest('[data-pd-ui]') ? undefined : (target.closest<HTMLElement>('[data-card]') ?? null);
  };
  const screenAt = (e: React.MouseEvent) => {
    const card = cardAt(e);

    return card === undefined ? undefined : (card?.dataset.screen ?? null);
  };
  const showDetails = (screen: string) => {
    select(screen);
    if (!inspectorOpen) togglePanel('inspector');
  };
  const onClick = (e: React.MouseEvent) => {
    // the comment button above a card: the bubble with the screen's comments, next to it (a second click closes it)
    const comment = (e.target as Element).closest<HTMLElement>('[data-pd-comment]')?.dataset.pdComment;

    if (comment) {
      select(comment);
      openComments(commentsOn === comment ? null : comment);

      return;
    }
    if (ctrl.current?.consumeDrag()) return;
    const card = cardAt(e);

    if (card === undefined) return;
    if (card?.dataset.screen) {
      // the clicked screen becomes the active one: the wheel scrolls it until Esc or a click on the empty board
      setActive(card.dataset.card ?? null);
      showDetails(card.dataset.screen);

      return;
    }
    setActive(null);
    select(null);
  };
  const onDoubleClick = (e: React.MouseEvent) => {
    const screen = screenAt(e);

    if (screen) openScreen(screen);
  };

  // ---- highlight
  // the highlight follows a pointer that rests, not one that only passes: every change of it repaints the board
  const [hover, setHover] = useState<{ card?: string; edge?: string }>({});
  const [hoverIntent] = useState(() => createIntent<{ card?: string; edge?: string }>((update) => setHover(update)));

  useEffect(() => hoverIntent.cancel, [hoverIntent]);
  const statusFilter = options.statusFilter;
  const related = useMemo(() => {
    const edge = hover.edge ? layout.edges.find((e) => e.id === hover.edge) : undefined;

    if (edge) return new Set([edge.from, edge.to]);
    const card = hover.card ? layout.cards.find((c) => c.key === hover.card) : undefined;

    if (!card || !links) return null;

    return new Set([card.screenId, ...targetsOf(links, card.screenId), ...(sources.get(card.screenId) ?? [])]);
  }, [hover, layout, links, sources]);
  // statuses belong to features (flows); a card takes the status of the flow its lane shows
  const flowOfLane = useMemo(() => new Map(layout.lanes.map((l) => [l.key, l.flowKey])), [layout.lanes]);
  const flowStatus = useCallback(
    (flowKey: string) => statusOf(statuses, flowStatusId(page.key, flowKey)),
    [statuses, page.key],
  );
  // people read names, not codes: the functional name of a screen, and the feature a way out leads to.
  // The ways out under a card, sorted as in the screen details: a screen of the same feature by its name, another feature
  // by the feature it opens ("arrow to a section"), and the navigation most screens repeat (a tab bar, a menu) as one line
  const exits = useMemo(() => {
    const onOtherPage = (id: string) => {
      const hit = project.pages.flatMap((p) => p.flows.map((f) => ({ p, f }))).find(({ f }) => f.screens.includes(id));

      return hit ? `${hit.p.name} · ${hit.f.name}` : nameOf(id);
    };

    return new Map(
      layout.stubs.map((s) => {
        const card = layout.cards.find((c) => c.key === s.cardKey);
        const feature = page.flows.find((f) => f.key === (card && flowOfLane.get(card.laneKey)));
        const g = groupTargets(s.targets, { page, feature, shared });
        const labels = [
          ...g.here.map(nameOf),
          ...g.elsewhere.flatMap((e) => (e.feature ? [e.feature.name] : e.ids.map(onOtherPage))),
          ...(g.shared.length ? [t.sharedNav] : []),
        ];

        return [s.cardKey, [...new Set(labels)]];
      }),
    );
  }, [layout, page, project, shared, flowOfLane, t, nameOf]);
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
              <a href={canvasHash('board', page.key, f.key)}>
                {f.name} <small className="pd-insp__key">{f.key}</small>
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
  }, [counts, screensCount, links, t, page, flowStatus]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the board is a canvas the pointer works on; its keys are listened to on the window
    // biome-ignore lint/a11y/useKeyWithClickEvents: the left panel and the search select screens from the keyboard
    <div
      ref={root}
      className="pd-board"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerOver={(e) => {
        const card = (e.target as Element).closest<HTMLElement>('[data-card]')?.dataset.card;

        hoverIntent.soon((h) => (h.edge || h.card === card ? h : { card }));
      }}
      onPointerLeave={() => hoverIntent.now(() => ({}))}
    >
      {flows.length === 0 && <div className="pd-empty">{t.noFlows}</div>}
      {devMode && <Measure host={root} on="board" />}

      <div ref={world} className="pd-world" style={{ width: layout.w, height: layout.h }}>
        {layout.lanes.map((l) => (
          <div
            key={l.key}
            className={`pd-lane${l.version ? ' pd-lane--version' : ''}`}
            style={{ top: l.y, width: l.w, height: l.h }}
          >
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
        <svg aria-hidden="true" className="pd-svg" width={layout.w} height={layout.h}>
          <defs>
            {['', '-hl', '-tie'].map((v) => (
              <marker
                key={v}
                id={`pd-arrow${v}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
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
                <path
                  d={e.d}
                  className="pd-edge__hit"
                  onPointerEnter={() => hoverIntent.soon(() => ({ edge: e.id }))}
                  onPointerLeave={() => hoverIntent.soon(() => ({}))}
                />
                <path
                  d={e.d}
                  className="pd-edge__line"
                  markerEnd={`url(#pd-arrow${on ? '-hl' : e.kind === 'outer' ? '-tie' : ''})`}
                />
              </g>
            );
          })}
          {layout.stubs.map((s) => {
            const on = hover.card === s.cardKey;

            // quiet by default (an arrow and how many ways out); the names show on hover — a way into another
            // feature is named by that feature, not by a screen code
            return (
              <g key={s.cardKey} className={`pd-stub${on ? ' is-on' : ''}`} data-stub={s.cardKey}>
                <path d={`M${s.x} ${s.y + 2} L${s.x} ${s.y + 22}`} markerEnd="url(#pd-arrow-tie)" />
                {on ? (
                  exits.get(s.cardKey)?.map((label, i) => (
                    <text key={label} x={s.x} y={s.y + 40 + i * 18} textAnchor="middle">
                      → {label}
                    </text>
                  ))
                ) : (
                  <text x={s.x} y={s.y + 38} textAnchor="middle" className="pd-stub__count">
                    {exits.get(s.cardKey)?.length ?? s.targets.length}
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
