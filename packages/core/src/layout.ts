import { orthoPath } from './flowgraph.ts';
import { targetsOf } from './links.ts';
import type { Hotspot, LinkMap } from './links.ts';
import type { Flow, FlowVersion, Screen, Viewport } from './model.ts';

/**
 * Board geometry, in world units (1 unit = 1 CSS px at zoom 100%).
 *
 *   lane name | card  card  card ...
 *
 * Every lane has a channel above its cards (arrows that skip forward) and one below (arrows that go back, and stubs for
 * targets outside the lane). Arrows between neighbours run straight, starting at the height of the element that triggers them.
 */
export const G = {
  laneLabelW: 280,
  cardPad: 10,
  cardHead: 46,
  colGap: 140,
  chTop: 120,
  chBottom: 160,
  versionTop: 100,
  laneGap: 40,
  /** Height a device frame gets on the board; page frames get a fixed width instead. */
  deviceFrameH: 360,
  pageFrameW: 440,
  levelStep: 14,
  maxLevel: 6,
  radius: 10,
} as const;

export type CardSize = { scale: number; frameW: number; frameH: number; w: number; h: number };

export const cardSize = (vp: Viewport): CardSize => {
  const scale = vp.kind === 'device' ? G.deviceFrameH / vp.height : G.pageFrameW / vp.width;
  const frameW = Math.round(vp.width * scale);
  const frameH = Math.round(vp.height * scale);

  return { scale, frameW, frameH, w: frameW + G.cardPad * 2, h: G.cardHead + frameH + G.cardPad * 2 };
};

export type Card = {
  key: string;
  laneKey: string;
  idx: number;
  screenId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Where the scaled screen sits inside the card (world units) and its scale. */
  frame: { x: number; y: number; w: number; h: number; scale: number };
  version?: { replaces?: string; findings: number[] };
};

export type EdgeKind = 'next' | 'skip' | 'back' | 'outer';
export type Edge = { id: string; kind: EdgeKind; fromCard: string; toCard: string; from: string; to: string; d: string; label: string; mid: { x: number; y: number } };
export type Stub = { cardKey: string; x: number; y: number; targets: string[] };
export type Tie = { id: string; d: string; fromCard: string; toCard: string };
export type Lane = { key: string; flowKey: string; name: string; version?: FlowVersion; y: number; h: number; w: number; cards: Card[] };
export type BoardLayout = { lanes: Lane[]; cards: Card[]; edges: Edge[]; stubs: Stub[]; ties: Tie[]; w: number; h: number };

export type LayoutInput = {
  flows: Flow[];
  screens: Map<string, Screen>;
  viewports: Record<string, Viewport>;
  links: LinkMap;
  showClosedVersions?: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Rounded orthogonal path: vertical from (x1,y1) to the channel at `yy`, across, vertical to (x2,y2). */
const channelPath = (x1: number, y1: number, x2: number, y2: number, yy: number) => {
  const r = Math.min(G.radius, Math.abs(x2 - x1) / 2);
  const dir = Math.sign(x2 - x1) || 1;
  const vy1 = Math.sign(yy - y1) || 1;
  const vy2 = Math.sign(y2 - yy) || 1;

  return `M${x1} ${y1} L${x1} ${yy - vy1 * r} Q${x1} ${yy} ${x1 + dir * r} ${yy} L${x2 - dir * r} ${yy} Q${x2} ${yy} ${x2} ${yy + vy2 * r} L${x2} ${y2}`;
};

/** Assigns channel levels so arcs whose spans overlap never share a level. Shorter arcs get the lower (closer) levels. */
const assignLevels = <T extends { lo: number; hi: number }>(arcs: T[]): Map<T, number> => {
  const placed: { lo: number; hi: number; level: number }[] = [];
  const out = new Map<T, number>();

  [...arcs]
    .sort((a, b) => a.hi - a.lo - (b.hi - b.lo) || a.lo - b.lo)
    .forEach((a) => {
      let level = 0;

      while (level < G.maxLevel && placed.some((p) => p.level === level && a.lo < p.hi && p.lo < a.hi)) level++;
      placed.push({ lo: a.lo, hi: a.hi, level });
      out.set(a, level);
    });

  return out;
};

const firstHotspot = (links: LinkMap, from: string, to: string): Hotspot | undefined =>
  (links[from] ?? []).filter((h) => h.to === to).sort((a, b) => a.y - b.y)[0];

const makeCard = (laneKey: string, idx: number, screen: Screen, vp: Viewport, x: number, y: number): Card => {
  const s = cardSize(vp);

  return {
    key: `${laneKey}:${screen.id}:${idx}`,
    laneKey,
    idx,
    screenId: screen.id,
    x,
    y,
    w: s.w,
    h: s.h,
    frame: { x: x + G.cardPad, y: y + G.cardHead + G.cardPad, w: s.frameW, h: s.frameH, scale: s.scale },
  };
};

export const computeLayout = ({ flows, screens, viewports, links, showClosedVersions = false }: LayoutInput): BoardLayout => {
  const lanes: Lane[] = [];
  const edges: Edge[] = [];
  const stubs: Stub[] = [];
  const ties: Tie[] = [];
  const vpOf = (s: Screen): Viewport => viewports[s.viewport ?? ''] ?? viewports.mobile ?? Object.values(viewports)[0]!;
  let cursor = 0;

  /** Arrows between the cards of one lane; `outer` = the flow's cards a version lane may point up to. */
  const wire = (lane: Lane, outer?: Card[]) => {
    const { cards } = lane;

    if (!cards.length) return;
    const top = cards[0]!.y;
    const bottom = Math.max(...cards.map((c) => c.y + c.h));
    type Arc = { from: Card; to: Card; lo: number; hi: number; label: string };
    const skips: Arc[] = [];
    const backs: Arc[] = [];

    cards.forEach((c) => {
      const outside: string[] = [];

      targetsOf(links, c.screenId).forEach((t) => {
        const label = firstHotspot(links, c.screenId, t)?.label ?? '';
        // the same screen can appear twice in a lane: prefer the nearest occurrence ahead of the source
        const inLane = cards.filter((o) => o.screenId === t).sort((a, b) => (a.idx > c.idx ? 0 : 1) - (b.idx > c.idx ? 0 : 1) || a.idx - b.idx)[0];
        const up = outer?.find((o) => o.screenId === t);

        if (inLane) {
          const arc = { from: c, to: inLane, lo: Math.min(c.idx, inLane.idx), hi: Math.max(c.idx, inLane.idx), label };

          if (inLane.idx === c.idx + 1) {
            const h = firstHotspot(links, c.screenId, t);
            const sy = h ? (h.belowFold ? c.frame.y + c.frame.h - 8 : c.frame.y + (h.y + h.h / 2) * c.frame.scale) : c.frame.y + c.frame.h / 2;
            const y1 = clamp(sy, c.frame.y + 6, c.frame.y + c.frame.h - 6);
            const x1 = c.x + c.w;
            const x2 = inLane.x;
            const y2 = clamp(y1, inLane.frame.y + 12, inLane.frame.y + inLane.frame.h - 12);
            const mx = (x1 + x2) / 2;

            edges.push({
              id: `${lane.key}>n${edges.length}`,
              kind: 'next',
              fromCard: c.key,
              toCard: inLane.key,
              from: c.screenId,
              to: t,
              label,
              d: orthoPath([[x1, y1], [mx, y1], [mx, y2], [x2 - 1, y2]]),
              mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
            });
          } else if (inLane.idx > c.idx) skips.push(arc);
          else backs.push(arc);
        } else if (up) {
          if (c.version?.replaces === t) return; // the original it replaces is already joined by the tie line
          const x1 = c.x + c.w * 0.85;
          const x2 = up.x + up.w * 0.85;
          const y1 = c.y;
          const y2 = up.y + up.h;
          const my = (y1 + y2) / 2;

          edges.push({ id: `${lane.key}>o${edges.length}`, kind: 'outer', fromCard: c.key, toCard: up.key, from: c.screenId, to: t, label, d: orthoPath([[x1, y1], [x1, my], [x2, my], [x2, y2 + 1]]), mid: { x: (x1 + x2) / 2, y: my } });
        } else outside.push(t);
      });
      if (outside.length) stubs.push({ cardKey: c.key, x: c.x + c.w - 28, y: c.y + c.h, targets: outside });
    });

    // spread arc end points along the card edges, ordered by where the other end is, so lines do not cross at the card
    const spread = (arcs: Arc[], edge: 'top' | 'bottom', from: number, to: number) => {
      const ports = new Map<Card, { arc: Arc; end: 's' | 't'; other: number }[]>();
      const add = (c: Card, p: { arc: Arc; end: 's' | 't'; other: number }) => (ports.get(c) ?? ports.set(c, []).get(c)!).push(p);

      arcs.forEach((a) => {
        add(a.from, { arc: a, end: 's', other: a.to.x });
        add(a.to, { arc: a, end: 't', other: a.from.x });
      });
      const xOf = new Map<string, number>();

      ports.forEach((list, c) => {
        list.sort((a, b) => a.other - b.other);
        list.forEach((p, i) => xOf.set(`${arcs.indexOf(p.arc)}${p.end}`, c.x + c.w * (from + ((to - from) * (i + 1)) / (list.length + 1))));
      });
      const levels = assignLevels(arcs);

      arcs.forEach((a, i) => {
        const xs = xOf.get(`${i}s`)!;
        const xt = xOf.get(`${i}t`)!;
        const level = levels.get(a)!;
        const y1 = edge === 'top' ? a.from.y : a.from.y + a.from.h;
        const y2 = edge === 'top' ? a.to.y : a.to.y + a.to.h;
        const yy = edge === 'top' ? top - 26 - level * G.levelStep : bottom + 56 + level * G.levelStep;

        edges.push({
          id: `${lane.key}>${edge === 'top' ? 's' : 'b'}${edges.length}`,
          kind: edge === 'top' ? 'skip' : 'back',
          fromCard: a.from.key,
          toCard: a.to.key,
          from: a.from.screenId,
          to: a.to.screenId,
          label: a.label,
          d: channelPath(xs, y1, xt, y2, yy),
          mid: { x: (xs + xt) / 2, y: yy },
        });
      });
    };

    spread(skips, 'top', 0.2, 0.8);
    spread(backs, 'bottom', 0.1, 0.7);
  };

  flows.forEach((flow) => {
    const laneY = cursor;
    const cards: Card[] = [];
    let x = G.laneLabelW;

    flow.screens.forEach((id) => {
      const s = screens.get(id);

      if (!s) return;
      const card = makeCard(flow.key, cards.length, s, vpOf(s), x, laneY + G.chTop);

      cards.push(card);
      x += card.w + G.colGap;
    });
    const cardsH = Math.max(0, ...cards.map((c) => c.h));
    const lane: Lane = { key: flow.key, flowKey: flow.key, name: flow.name, y: laneY, h: G.chTop + cardsH + G.chBottom, w: x, cards };

    lanes.push(lane);
    wire(lane);
    cursor += lane.h;

    const versions = (flow.versions ?? []).filter((v) => showClosedVersions || v.state === 'open');

    versions.forEach((version) => {
      const vy = cursor;
      const laneKey = `${flow.key}/${version.key}`;
      const slotOf = new Map(cards.map((c) => [c.screenId, c.idx]));
      const used = new Set<number>();
      const placed: { s: Screen; slot: number; vs: (typeof version.screens)[number] }[] = [];

      // replacing screens take the column of their original; new screens take the first free column after `after` (or the end)
      version.screens.forEach((vs) => {
        const s = screens.get(vs.id);
        const slot = vs.replaces !== undefined ? slotOf.get(vs.replaces) : undefined;

        if (s && slot !== undefined && !used.has(slot)) {
          used.add(slot);
          placed.push({ s, slot, vs });
        }
      });
      version.screens.forEach((vs) => {
        const s = screens.get(vs.id);

        if (!s || placed.some((p) => p.vs === vs)) return;
        let slot = vs.after !== undefined && slotOf.has(vs.after) ? slotOf.get(vs.after)! + 1 : Math.max(cards.length, ...[...used].map((u) => u + 1));

        while (used.has(slot)) slot++;
        used.add(slot);
        placed.push({ s, slot, vs });
      });
      placed.sort((a, b) => a.slot - b.slot);

      const colX = (slot: number) => {
        if (slot < cards.length) return cards[slot]!.x;
        const last = cards[cards.length - 1];
        const base = last ? last.x + last.w + G.colGap : G.laneLabelW;
        const step = (cards[0]?.w ?? cardSize(viewports.mobile ?? Object.values(viewports)[0]!).w) + G.colGap;

        return base + (slot - cards.length) * step;
      };
      const vcards = placed.map((p, i) => {
        const c = makeCard(laneKey, i, p.s, vpOf(p.s), colX(p.slot), vy + G.versionTop);

        c.version = { replaces: p.vs.replaces, findings: p.vs.findings ?? [] };

        return c;
      });
      const vh = G.versionTop + Math.max(0, ...vcards.map((c) => c.h)) + G.chBottom;
      const vlane: Lane = { key: laneKey, flowKey: flow.key, name: version.name, version, y: vy, h: vh, w: Math.max(lane.w, ...vcards.map((c) => c.x + c.w + G.colGap)), cards: vcards };

      lanes.push(vlane);
      vcards.forEach((c) => {
        const orig = c.version?.replaces ? cards.find((o) => o.screenId === c.version!.replaces) : undefined;

        if (orig) {
          const tx = c.x + c.w * 0.12;

          ties.push({ id: `${c.key}^`, fromCard: c.key, toCard: orig.key, d: `M${tx} ${c.y} L${tx} ${orig.y + orig.h + 1}` });
        }
      });
      wire(vlane, cards);
      cursor += vh;
    });
    // a flow and its versions share one width so they read as one block
    const block = lanes.filter((l) => l.flowKey === flow.key);
    const w = Math.max(...block.map((l) => l.w));

    block.forEach((l) => (l.w = w));
    cursor += G.laneGap;
  });

  const cards = lanes.flatMap((l) => l.cards);

  return { lanes, cards, edges, stubs, ties, w: Math.max(0, ...lanes.map((l) => l.w)), h: Math.max(0, cursor - G.laneGap) };
};
