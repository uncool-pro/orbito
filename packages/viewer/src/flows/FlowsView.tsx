import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { computeFlowGraph } from '@uncool-pro/orbito-core';
import type { FlowEdgeKind, FlowNode, Page } from '@uncool-pro/orbito-core';
import { screenHash } from '@uncool-pro/orbito-runtime';

import { useViewer } from '../app/context';
import { setInspectorExtra, setZoom, useShell } from '../app/shell/state';
import { centerOn, fitRect, zoomAt } from '../canvas/camera';
import { CanvasController } from '../canvas/controller';
import { useT } from '../i18n';

const KINDS: FlowEdgeKind[] = ['happy', 'alternative', 'negative', 'other'];

/**
 * Flows as a diagram: every screen of a page (or of one flow) as a node, every link found in the screens as an arrow,
 * coloured by the kind of path it belongs to. Generated from the screens, so it is always in sync with the mockups,
 * and it lists what to look at first: dead ends, unreachable screens, flow steps with no link.
 */
export const FlowsView = ({ page, flowKey }: { page: Page; flowKey?: string }) => {
  const { project, links } = useViewer();
  const t = useT();
  const byId = useMemo(() => new Map(project.screens.map((s) => [s.id, s])), [project]);
  const flow = page.flows.find((f) => f.key === flowKey);
  const scope = useMemo(() => [...new Set((flow ? [flow] : page.flows).flatMap((f) => f.screens))], [page, flow]);
  const graph = useMemo(
    () => (links ? computeFlowGraph({ scope, flows: page.flows, links, screens: byId, viewports: project.viewports }) : null),
    [links, scope, page, byId, project.viewports],
  );
  const [hover, setHover] = useState<string | null>(null);
  // links outside any mapped flow (tab bars, menus) are useful but noisy: hidden until asked for
  const { options, selected, select, focusTick, canvas } = useShell();
  const showOther = options.showOther;
  const wheelRef = useRef(options.wheelZooms);

  wheelRef.current = options.wheelZooms;
  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const ctrl = useRef<CanvasController | null>(null);
  const code = (id: string) => byId.get(id)?.code ?? id;

  useLayoutEffect(() => {
    const el = root.current;

    if (!el || !graph) return;
    const fit = () => fitRect({ x: 0, y: 0, w: graph.w, h: graph.h }, { w: el.clientWidth, h: el.clientHeight - 64 }, { inset: 8, pad: 48, maxK: 1.6 });
    const controller = new CanvasController(el, {
      initial: fit(),
      onChange: (c) => {
        if (world.current) world.current.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.k})`;
        el.style.backgroundSize = `${24 * c.k}px ${24 * c.k}px`;
        el.style.backgroundPosition = `${c.x}px ${c.y}px`;
        setZoom(c.k);
      },
      scrollerAt: () => null,
      isUi: (target) => !!target.closest('[data-pd-ui]'),
      prefs: () => ({ wheelZooms: wheelRef.current }),
    });

    ctrl.current = controller;
    controller.set(controller.camera);
    canvas.current = {
      zoomBy: (f) => controller.set(zoomAt(controller.camera, f, el.clientWidth / 2, el.clientHeight / 2)),
      fit: () => controller.set(fit()),
    };
    // refit while the view changes size (a tab opened in the background has no size yet), until the person moves the diagram
    let touched = false;
    const touch = () => (touched = true);
    const ro = new ResizeObserver(() => {
      if (!touched && el.clientWidth && el.clientHeight) controller.set(fit());
    });

    ro.observe(el);
    el.addEventListener('pointerdown', touch);
    el.addEventListener('wheel', touch);

    return () => {
      ro.disconnect();
      el.removeEventListener('pointerdown', touch);
      el.removeEventListener('wheel', touch);
      controller.destroy();
      canvas.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const focus = (id: string) => select(id, { focus: true });

  // a step picked in the left panel, the search or the findings: bring it into view
  useEffect(() => {
    const n = selected ? graph?.nodes.find((x) => x.id === selected) : undefined;
    const el = root.current;

    if (n && el && ctrl.current && focusTick) ctrl.current.set(centerOn(ctrl.current.camera, n, { w: el.clientWidth, h: el.clientHeight }, 0.9));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick, graph]);
  const focusId = hover ?? selected;
  const related = useMemo(() => {
    if (!focusId || !graph) return null;
    const s = new Set([focusId]);

    graph.edges.forEach((e) => {
      if (e.from === focusId) s.add(e.to);
      if (e.to === focusId) s.add(e.from);
    });

    return s;
  }, [focusId, graph]);
  const nodeState = (n: FlowNode) => (!related ? '' : related.has(n.id) ? ' is-hl' : ' is-dim');
  const findings = graph ? graph.deadEnds.length + graph.unreachable.length + graph.missingSteps.length : 0;

  // legend and findings live in the inspector while nothing is selected
  useEffect(() => {
    setInspectorExtra(
      <section className="pd-insp pd-findings">
        <h3>{t.legend}</h3>
        <ul className="pd-legend">
          {KINDS.map((k) => (
            <li key={k}>
              <i className={`pd-legend__line pd-fedge--${k}`} />
              {t.pathKinds[k]}
            </li>
          ))}
        </ul>
        <h3>
          {t.findings} {graph && <span className={`pd-count${findings ? '' : ' is-ok'}`}>{findings || '✓'}</span>}
        </h3>
        {graph && findings === 0 && <p className="pd-muted">{t.noFindings}</p>}
        {graph?.deadEnds.map((id) => (
          <button key={`d${id}`} type="button" className="pd-finding" onClick={() => focus(id)}>
            <b>{code(id)}</b> {t.deadEnd}
          </button>
        ))}
        {graph?.unreachable
          .filter((id) => !graph.deadEnds.includes(id))
          .map((id) => (
            <button key={`u${id}`} type="button" className="pd-finding" onClick={() => focus(id)}>
              <b>{code(id)}</b> {t.unreachable}
            </button>
          ))}
        {graph?.missingSteps.map((m) => (
          <button key={`m${m.flow}${m.from}`} type="button" className="pd-finding" onClick={() => focus(m.from)}>
            <b>
              {m.flow}: {code(m.from)} → {code(m.to)}
            </b>{' '}
            {t.missingStep}
          </button>
        ))}
        <p className="pd-findings__note">{t.flowsNote}</p>
      </section>,
    );

    return () => setInspectorExtra(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, findings, t]);

  return (
    <div
      ref={root}
      className="pd-board pd-flows"
      onPointerLeave={() => setHover(null)}
      onClick={(e) => {
        if (ctrl.current?.consumeDrag()) return;
        const box = (e.target as Element).closest<HTMLElement>('[data-step]');

        if (!(e.target as Element).closest('[data-pd-ui]')) select(box?.dataset.step ?? null);
      }}
    >
      {!graph ? (
        <div className="pd-empty">{t.detecting}</div>
      ) : (
        <div ref={world} className="pd-world" style={{ width: graph.w, height: graph.h }}>
          <svg className="pd-svg" width={graph.w} height={graph.h}>
            <defs>
              {KINDS.map((k) => (
                <marker key={k} id={`pd-fa-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" className={`pd-fa pd-fa--${k}`} />
                </marker>
              ))}
            </defs>
            {graph.edges.filter((e) => showOther || e.kind !== 'other').map((e) => {
              const on = focusId && (e.from === focusId || e.to === focusId);

              return (
                <path
                  key={e.id}
                  d={e.d}
                  className={`pd-fedge pd-fedge--${e.kind}${on ? ' is-on' : focusId ? ' is-faded' : ''}`}
                  markerEnd={`url(#pd-fa-${e.kind})`}
                >
                  <title>{`${code(e.from)} → ${code(e.to)}${e.label ? ` · „${e.label}”` : ''}${e.flows.length ? ` · ${e.flows.join(', ')}` : ''}`}</title>
                </path>
              );
            })}
            {graph.edges
              .filter((e) => e.trigger !== 'tap' && (showOther || e.kind !== 'other'))
              .map((e) => (
                <g key={`l${e.id}`} className={`pd-flabel pd-flabel--${e.kind}`} transform={`translate(${e.mid.x} ${e.mid.y})`}>
                  <text textAnchor="middle" y={-8}>
                    {t.triggers[e.trigger] ?? e.trigger}: {e.label}
                  </text>
                </g>
              ))}
            {graph.nodes
              .filter((n) => n.entry)
              .map((n) => (
                <path key={`sl${n.id}`} d={`M${n.x - 42} ${n.y + n.h / 2} L${n.x - 1} ${n.y + n.h / 2}`} className="pd-fedge pd-fedge--happy" markerEnd="url(#pd-fa-happy)" />
              ))}
          </svg>
          {graph.nodes.map((n) => {
            const s = byId.get(n.id)!;
            const warn = graph.deadEnds.includes(n.id) || graph.unreachable.includes(n.id);
            const exits = graph.exits[n.id] ?? [];

            return (
              <div
                key={n.id}
                data-step={n.id}
                className={`pd-fbox pd-fbox--${n.path}${nodeState(n)}${selected === n.id ? ' is-selected' : ''}${warn ? ' is-warn' : ''}`}
                style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
                onPointerEnter={() => setHover(n.id)}
                onDoubleClick={() => (window.location.hash = screenHash(n.id))}
              >
                <b>{code(n.id)}</b>
                <span>{s.title.split(' / ').pop()}</span>
                {exits.length > 0 && <small className="pd-fbox__exits">→ {exits.map(code).join(', ')}</small>}
              </div>
            );
          })}
          {graph.nodes
            .filter((n) => n.entry)
            .map((n) => (
              <div key={`s${n.id}`} className="pd-fstart" style={{ left: n.x - 64, top: n.y + n.h / 2 - 11 }} title={t.start}>
                <i />
              </div>
            ))}
        </div>
      )}

    </div>
  );
};
