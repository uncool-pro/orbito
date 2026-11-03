import { useEffect, useMemo, useRef, useState } from 'react';

import { featureLinks, flowStatusId, sharedTargets, statusOf } from '@uncool-pro/orbito-core';
import type { Flow, Page } from '@uncool-pro/orbito-core';

import { useViewer } from '../app/context';
import { canvasHash } from '../app/routes';
import { setInspectorExtra, setZoom, useShell } from '../app/shell/state';
import { useT } from '../i18n';
import { useStatuses } from '../status';
import { FlowsView } from './FlowsView';

const MODE_KEY = 'pd.flowsMap';
const W = 236;
const H = 92;
const GX = 150;
const GY = 36;
const PAD = 56;

type Placed = { f: Flow; x: number; y: number };

/**
 * Columns from the start: the first feature of the page in the first column, then the features its links lead to, and so
 * on; features nothing leads to start a column of their own at the left.
 */
const place = (page: Page, links: { from: string; to: string }[]): Map<string, Placed> => {
  const rank = new Map<string, number>();
  const queue: string[] = [];

  for (const f of page.flows) {
    if (rank.has(f.key)) continue;
    // a feature not reached from the ones before it starts again at the left
    rank.set(f.key, 0);
    queue.push(f.key);
    while (queue.length) {
      const k = queue.shift()!;

      for (const l of links)
        if (l.from === k && !rank.has(l.to)) {
          rank.set(l.to, rank.get(k)! + 1);
          queue.push(l.to);
        }
    }
  }
  const rows = new Map<number, number>();
  const out = new Map<string, Placed>();

  for (const f of page.flows) {
    const r = rank.get(f.key) ?? 0;
    const i = rows.get(r) ?? 0;

    rows.set(r, i + 1);
    out.set(f.key, { f, x: PAD + r * (W + GX), y: PAD + i * (H + GY) });
  }

  return out;
};

/**
 * A page seen from far away: each feature one box, an arrow between two features with the number of links that lead
 * from one to the other. The menu most screens repeat is left out, it would join everything to everything. Right-angle
 * arrows: forward ones leave on the right, ones going back enter the target on its right side. A test of the "product
 * map" from the UX analysis; screens open with a click on a feature.
 */
export const FeatureMap = ({ page }: { page: Page }) => {
  const { project, links } = useViewer();
  const { canvas } = useShell();
  const statuses = useStatuses();
  const t = useT();
  const [hover, setHover] = useState<string | null>(null);
  const [k, setK] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const shared = useMemo(() => (links ? sharedTargets(links) : new Set<string>()), [links]);
  const edges = useMemo(() => (links ? featureLinks(page, links, shared) : []), [page, links, shared]);
  const placed = useMemo(() => place(page, edges), [page, edges]);
  const width = Math.max(...[...placed.values()].map((p) => p.x + W)) + PAD + GX;
  const height = Math.max(...[...placed.values()].map((p) => p.y + H)) + PAD;
  const byId = useMemo(() => new Map(project.screens.map((s) => [s.id, s])), [project]);

  // the island's zoom works here too
  useEffect(() => {
    const fit = () => {
      const el = box.current;

      if (el) setK(Math.min(1.4, (el.clientWidth - 32) / width, (el.clientHeight - 96) / height));
    };

    canvas.current = { zoomBy: (f) => setK((v) => Math.min(2, Math.max(0.3, v * f))), fit };
    fit();

    return () => {
      canvas.current = null;
    };
  }, [canvas, width, height]);
  useEffect(() => setZoom(k), [k]);
  useEffect(() => {
    setInspectorExtra(
      <section className="pd-insp">
        <h4>{t.mapFeatures}</h4>
        <p className="pd-muted">{t.featureMapNote}</p>
        {shared.size > 0 && (
          <p className="pd-insp__shared">
            {t.menuLeftOut}: {[...shared].map((id) => byId.get(id)?.title.split(' / ').pop() ?? id).join(' · ')}
          </p>
        )}
      </section>,
    );

    return () => setInspectorExtra(null);
  }, [shared, byId, t]);

  const lane = new Map<string, number>();
  const nextLane = (key: string) => {
    const n = lane.get(key) ?? 0;

    lane.set(key, n + 1);

    return n * 8;
  };

  return (
    <div ref={box} className="pd-fmap">
      {!links ? (
        <div className="pd-empty">{t.detecting}</div>
      ) : (
        <div className="pd-fmap__world" style={{ width, height, zoom: k }}>
          <svg width={width} height={height} className="pd-svg">
            <defs>
              <marker id="pd-fmap-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className="pd-fmap__head" />
              </marker>
            </defs>
            {edges.map((e) => {
              const s = placed.get(e.from)!;
              const d = placed.get(e.to)!;
              const sy = s.y + H / 2 - 6;
              const ty = d.y + H / 2 + 6;
              let path: string;
              let mx: number;

              // forward arrows run in the left half of the gap between columns, arrows going back in the right half
              if (d.x > s.x) {
                mx = s.x + W + 24 + nextLane(`f${s.x}`);
                path = `M${s.x + W} ${sy} H${mx} V${ty} H${d.x}`;
              } else if (d.x < s.x) {
                mx = s.x - 24 - nextLane(`b${s.x}`);
                path = `M${s.x} ${sy} H${mx} V${ty} H${d.x + W}`;
              } else {
                mx = s.x + W + 28 + nextLane(`s${s.x}`);
                path = `M${s.x + W} ${sy} H${mx} V${ty} H${d.x + W}`;
              }
              const on = hover === e.from || hover === e.to;

              return (
                <g key={`${e.from}-${e.to}`} className={`pd-fmap__edge${on ? ' is-on' : hover ? ' is-faded' : ''}`}>
                  <path d={path} markerEnd="url(#pd-fmap-arrow)" />
                  <text x={mx + 4} y={(sy + ty) / 2 + 4}>
                    {e.count}
                  </text>
                  <title>{`${s.f.name} → ${d.f.name} · ${t.linksCount(e.count)}`}</title>
                </g>
              );
            })}
          </svg>
          {[...placed.values()].map(({ f, x, y }) => {
            const st = statusOf(statuses, flowStatusId(page.key, f.key)).status;

            return (
              <a
                key={f.key}
                href={canvasHash('flows', page.key, f.key)}
                className={`pd-fmap__box pd-fmap__box--${f.path ?? 'happy'}${hover && hover !== f.key ? ' is-dim' : ''}`}
                style={{ left: x, top: y, width: W, height: H }}
                onPointerEnter={() => setHover(f.key)}
                onPointerLeave={() => setHover(null)}
              >
                <b>{f.name}</b>
                <span>
                  {f.key} · {t.cards(f.screens.length)}
                </span>
                <i className={`pd-dot pd-status--${st}`} title={t.statusLabels[st]} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

const readMode = () => {
  try {
    return localStorage.getItem(MODE_KEY) === 'features' ? 'features' : 'screens';
  } catch {
    return 'screens';
  }
};

/** The flows view of a page: every screen (the diagram) or every feature (the map), with a switch; one feature is always screens. */
export const FlowsPage = ({ page, flowKey }: { page: Page; flowKey?: string }) => {
  const t = useT();
  const [mode, setMode] = useState(readMode);
  const pick = (m: 'screens' | 'features') => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage unavailable */
    }
  };

  if (flowKey) return <FlowsView page={page} flowKey={flowKey} />;

  return (
    <>
      {mode === 'features' ? <FeatureMap page={page} /> : <FlowsView page={page} />}
      <div className="pd-mapswitch pd-sizes" role="group" data-pd-ui>
        {(['screens', 'features'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => pick(m)}>
            {m === 'screens' ? t.mapScreens : t.mapFeatures}
          </button>
        ))}
      </div>
    </>
  );
};
