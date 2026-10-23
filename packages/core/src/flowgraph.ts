import { targetsOf } from './links.ts';
import type { LinkMap } from './links.ts';
import type { Flow, FlowPath, Screen, Viewport } from './model.ts';

// viewports stay in the input: the view uses them for the screen preview of a step

/**
 * The "Flows" view: a business-style diagram (boxes and right-angled arrows, no screen previews: the board already shows
 * the screens) of how the steps connect, computed from the links found in the screens themselves.
 * It never goes stale (no one redraws it by hand) and it costs no tokens. It also finds what a UX review looks for first:
 * dead ends, screens nobody can reach, and flow steps that have no link between them.
 */
export const FG = {
  boxW: 196,
  boxH: 64,
  colGap: 104,
  rowGap: 48,
  pad: 80,
  radius: 8,
} as const;

export type FlowEdgeKind = FlowPath | 'other';

export type FlowNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
  entry: boolean;
  /** The strongest kind of path the step belongs to (a step only on an error path is `negative`). */
  path: FlowEdgeKind;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  kind: FlowEdgeKind;
  flows: string[];
  back: boolean;
  d: string;
  label: string;
  /** What triggers it: `tap` for elements, `error` / `timeout` / `auto` for a `<Transition>`. */
  trigger: string;
  /** Point on the line for its label. */
  mid: { x: number; y: number };
};

export type FlowGraph = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Screens with no way out: no link forward and no back link. */
  deadEnds: string[];
  /** Screens in scope that cannot be reached from the entry screens. */
  unreachable: string[];
  /** Consecutive screens of a flow with no link between them. */
  missingSteps: { flow: string; from: string; to: string }[];
  /** Links that leave the scope (to screens shown elsewhere), by source screen. */
  exits: Record<string, string[]>;
  w: number;
  h: number;
};

export type FlowGraphInput = {
  /** Screens to draw (e.g. all screens of a page, or of one flow). */
  scope: string[];
  flows: Flow[];
  links: LinkMap;
  screens: Map<string, Screen>;
  viewports: Record<string, Viewport>;
};

const PRIORITY: FlowEdgeKind[] = ['happy', 'alternative', 'negative', 'other'];

type Pt = [number, number];

/** Right-angled path through the points, corners slightly rounded (never curves between them). */
export const orthoPath = (pts: Pt[], r: number = FG.radius): string => {
  const clean = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1]![0] || p[1] !== pts[i - 1]![1]);
  let d = `M${clean[0]![0]} ${clean[0]![1]}`;

  for (let i = 1; i < clean.length - 1; i++) {
    const [px, py] = clean[i - 1]!;
    const [cx, cy] = clean[i]!;
    const [nx, ny] = clean[i + 1]!;
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const ax = cx - ((cx - px) / (inLen || 1)) * rr;
    const ay = cy - ((cy - py) / (inLen || 1)) * rr;
    const bx = cx + ((nx - cx) / (outLen || 1)) * rr;
    const by = cy + ((ny - cy) / (outLen || 1)) * rr;

    d += ` L${ax} ${ay} Q${cx} ${cy} ${bx} ${by}`;
  }
  const last = clean[clean.length - 1]!;

  return `${d} L${last[0]} ${last[1]}`;
};

export const computeFlowGraph = ({ scope, flows, links, screens }: FlowGraphInput): FlowGraph => {
  const inScope = new Set(scope.filter((id) => screens.has(id)));
  const ids = [...inScope];

  // ---- checks on the whole project graph
  const deadEnds = ids.filter((id) => targetsOf(links, id).length === 0 && !(links[id] ?? []).some((h) => h.to === null));
  const entries = [...new Set(flows.filter((f) => (f.path ?? 'happy') === 'happy').map((f) => f.screens[0]).filter((s): s is string => !!s && inScope.has(s)))];

  if (!entries.length && ids[0]) entries.push(flows[0]?.screens.find((s) => inScope.has(s)) ?? ids[0]);
  const reached = new Set(entries);
  const queue = [...entries];

  while (queue.length) {
    const id = queue.shift()!;

    targetsOf(links, id).forEach((t) => {
      if (!reached.has(t)) {
        reached.add(t);
        queue.push(t);
      }
    });
  }
  const unreachable = ids.filter((id) => !reached.has(id));
  const missingSteps: FlowGraph['missingSteps'] = [];

  flows.forEach((f) =>
    f.screens.forEach((s, i) => {
      const next = f.screens[i + 1];

      if (next && inScope.has(s) && inScope.has(next) && !targetsOf(links, s).includes(next)) missingSteps.push({ flow: f.key, from: s, to: next });
    }),
  );

  // ---- edges inside the scope, typed by the flows they belong to
  const kindsOf = new Map<string, { kinds: Set<FlowEdgeKind>; flows: string[] }>();

  flows.forEach((f) =>
    f.screens.forEach((s, i) => {
      const next = f.screens[i + 1];

      if (!next) return;
      const k = `${s}>${next}`;
      const e = kindsOf.get(k) ?? kindsOf.set(k, { kinds: new Set(), flows: [] }).get(k)!;

      e.kinds.add(f.path ?? 'happy');
      e.flows.push(f.key);
    }),
  );
  const raw: { from: string; to: string; kind: FlowEdgeKind; flows: string[]; label: string; trigger: string }[] = [];
  const exits: Record<string, string[]> = {};

  ids.forEach((from) =>
    targetsOf(links, from).forEach((to) => {
      if (!inScope.has(to)) return void (exits[from] ??= []).push(to);
      const info = kindsOf.get(`${from}>${to}`);
      const kind = info ? PRIORITY.find((p) => info.kinds.has(p))! : 'other';
      const spot = (links[from] ?? []).find((h) => h.to === to);

      raw.push({ from, to, kind, flows: info?.flows ?? [], label: spot?.label ?? '', trigger: spot?.trigger ?? 'tap' });
    }),
  );

  // ---- layers: distance along the mapped flows first (every flow starts a path of its own), then along other links;
  // links outside the flows (tab bars, menus) must not decide where a screen sits
  const level = new Map<string, number>();
  const spread = (roots: string[], usable: (e: (typeof raw)[number]) => boolean) => {
    const q = roots.filter((r) => !level.has(r) || level.get(r) === 0);

    roots.forEach((r) => !level.has(r) && level.set(r, 0));
    while (q.length) {
      const id = q.shift()!;

      raw.filter((e) => e.from === id && usable(e)).forEach((e) => {
        if (!level.has(e.to)) {
          level.set(e.to, level.get(id)! + 1);
          q.push(e.to);
        }
      });
    }
  };
  const flowRoots = [...flows]
    .sort((a, b) => PRIORITY.indexOf(a.path ?? 'happy') - PRIORITY.indexOf(b.path ?? 'happy'))
    .map((f) => f.screens.find((id) => inScope.has(id)))
    .filter((id): id is string => !!id && !raw.some((e) => e.to === id && e.kind !== 'other' && e.from !== id && flows.some((f) => (f.path ?? 'happy') === 'happy' && f.screens[0] === e.from)));

  spread([...new Set([...entries, ...flowRoots])], (e) => e.kind !== 'other');
  spread([...level.keys()], () => true);
  const maxLevel = Math.max(0, ...level.values());

  ids.filter((id) => !level.has(id)).forEach((id) => level.set(id, maxLevel + 1));
  const columns: string[][] = [];

  // keep the order the flows list screens in (happy path first), so the main path reads as the top row
  const order = [...flows].sort((a, b) => PRIORITY.indexOf(a.path ?? 'happy') - PRIORITY.indexOf(b.path ?? 'happy')).flatMap((f) => f.screens);
  const rank = (id: string) => {
    const i = order.indexOf(id);

    return i < 0 ? order.length + ids.indexOf(id) : i;
  };

  ids.forEach((id) => (columns[level.get(id)!] ??= []).push(id));
  columns.forEach((col) => col.sort((a, b) => rank(a) - rank(b)));
  // one barycentre pass: place screens near the screens that lead to them
  for (let c = 1; c < columns.length; c++) {
    const prev = columns[c - 1] ?? [];
    const bary = (id: string) => {
      const ps = raw.filter((e) => e.to === id && prev.includes(e.from)).map((e) => prev.indexOf(e.from));

      return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : Number.POSITIVE_INFINITY;
    };

    columns[c]?.sort((a, b) => bary(a) - bary(b) || rank(a) - rank(b));
  }

  // ---- geometry: the main happy path is the top row, read left to right; every other step sits below it in its column
  const mainPath = new Set(flows.find((f) => (f.path ?? 'happy') === 'happy' && f.screens.some((id) => inScope.has(id)))?.screens ?? []);
  const rowOf = new Map<string, number>();

  columns.forEach((col) => {
    let next = mainPath.size ? 1 : 0;
    let topTaken = false;

    (col ?? [])
      .sort((a, b) => Number(mainPath.has(b)) - Number(mainPath.has(a)))
      .forEach((id) => {
        if (mainPath.has(id) && !topTaken) {
          rowOf.set(id, 0);
          topTaken = true;
        } else rowOf.set(id, next++);
      });
  });
  const rows = Math.max(0, ...rowOf.values()) + 1;
  const pathOf = (id: string): FlowEdgeKind =>
    PRIORITY.find((k) => flows.some((f) => (f.path ?? 'happy') === k && f.screens.includes(id))) ?? 'other';
  const nodes: FlowNode[] = ids.map((id) => ({
    id,
    x: FG.pad + level.get(id)! * (FG.boxW + FG.colGap),
    y: FG.pad + rowOf.get(id)! * (FG.boxH + FG.rowGap),
    w: FG.boxW,
    h: FG.boxH,
    level: level.get(id)!,
    entry: entries.includes(id),
    path: pathOf(id),
  }));
  const at = new Map(nodes.map((n) => [n.id, n]));
  const top = FG.pad;

  // ports: an arrow to a step in the same row leaves from the middle and runs straight; the others are spread above
  // or below the middle, depending on where their other end is, so lines never cross at the box
  const portY = new Map<string, number>();
  const spreadPorts = (key: (e: (typeof raw)[number]) => string | null, other: (e: (typeof raw)[number]) => FlowNode) => {
    const groups = new Map<string, number[]>();

    raw.forEach((e, i) => {
      const k = key(e);

      if (k) (groups.get(k) ?? groups.set(k, []).get(k)!).push(i);
    });
    groups.forEach((list, k) => {
      const node = at.get(k.split('|')[0]!)!;
      const level = list.filter((i) => other(raw[i]!).y === node.y);
      const above = list.filter((i) => other(raw[i]!).y < node.y).sort((x, y) => other(raw[x]!).y - other(raw[y]!).y);
      const below = list.filter((i) => other(raw[i]!).y > node.y).sort((x, y) => other(raw[x]!).y - other(raw[y]!).y);
      const place = (ids: number[], from: number, to: number) =>
        ids.forEach((i, j) => portY.set(`${k}|${i}`, node.y + node.h * (from + ((to - from) * (j + 1)) / (ids.length + 1))));

      place(level, level.length > 1 ? 0.3 : 0, level.length > 1 ? 0.7 : 1);
      place(above, 0, level.length ? 0.45 : 1);
      place(below, level.length ? 0.55 : 0, 1);
    });
  };
  const fwd = (e: (typeof raw)[number]) => at.get(e.to)!.level > at.get(e.from)!.level;

  spreadPorts((e) => (fwd(e) ? `${e.from}|out` : null), (e) => at.get(e.to)!);
  spreadPorts((e) => (fwd(e) ? `${e.to}|in` : null), (e) => at.get(e.from)!);

  const edges: FlowEdge[] = raw.map((e, i) => {
    const a = at.get(e.from)!;
    const b = at.get(e.to)!;
    const back = b.level <= a.level;
    const lane = (i % 3) * 8 - 8; // keeps parallel vertical segments apart
    let pts: Pt[];
    let mid: { x: number; y: number };

    if (!back) {
      const y1 = portY.get(`${e.from}|out|${i}`) ?? a.y + a.h / 2;
      const y2 = portY.get(`${e.to}|in|${i}`) ?? b.y + b.h / 2;
      const xm = b.x - FG.colGap / 2 + lane;

      pts = [[a.x + a.w, y1], [xm, y1], [xm, y2], [b.x, y2]];
      mid = Math.abs(y1 - y2) < 1 ? { x: (a.x + a.w + b.x) / 2, y: y1 } : { x: xm, y: (y1 + y2) / 2 };
    } else if (b.level === a.level) {
      // same column: out of the right side, down or up beside the boxes, back into the right side
      const xs = a.x + a.w + 26 + lane;

      pts = [[a.x + a.w, a.y + a.h * 0.65], [xs, a.y + a.h * 0.65], [xs, b.y + b.h * 0.35], [b.x + b.w, b.y + b.h * 0.35]];
      mid = { x: xs, y: (a.y + b.y + a.h) / 2 };
    } else if (rowOf.get(e.from) === 0) {
      // going back from the top row: over the top, where nothing else is drawn
      const arc = top - 28 - (i % 3) * 12;
      const x1 = a.x + a.w * 0.5;
      const x2 = b.x + b.w * 0.5 + lane;

      pts = [[x1, a.y], [x1, arc], [x2, arc], [x2, b.y]];
      mid = { x: (x1 + x2) / 2, y: arc };
    } else {
      // going back from a lower row: out of the left side, along the gap right of the target, into its right side
      const xm = b.x + b.w + FG.colGap / 2 + lane;
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h * 0.7;

      pts = [[a.x, y1], [xm, y1], [xm, y2], [b.x + b.w, y2]];
      mid = { x: xm, y: (y1 + y2) / 2 };
    }

    return { id: `e${i}`, from: e.from, to: e.to, kind: e.kind, flows: e.flows, back, d: orthoPath(pts), label: e.label, trigger: e.trigger, mid };
  });
  const width = FG.pad * 2 + (Math.max(0, ...nodes.map((n) => n.level)) + 1) * (FG.boxW + FG.colGap) - FG.colGap;
  const tallest = rows * (FG.boxH + FG.rowGap) - FG.rowGap;

  return {
    nodes,
    edges,
    deadEnds,
    unreachable,
    missingSteps,
    exits,
    w: width + 60,
    h: FG.pad * 2 + tallest,
  };
};
