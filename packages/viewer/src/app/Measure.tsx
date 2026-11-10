import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useViewer } from './context';

type Box = { x: number; y: number; w: number; h: number };
type Line = { x1: number; y1: number; x2: number; y2: number; value: number };

const boxOf = (el: Element, origin: DOMRect): Box => {
  const r = el.getBoundingClientRect();

  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
};

const contains = (a: Box, b: Box) =>
  a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5;

/**
 * The distances a developer reads in Figma, between two boxes on screen: from an inner box to each edge of the outer one,
 * or the gaps between two boxes side by side. Pure geometry, in on-screen pixels.
 */
export const distances = (a: Box, b: Box): Line[] => {
  const [outer, inner] = contains(a, b) ? [a, b] : contains(b, a) ? [b, a] : [null, null];

  if (outer && inner) {
    const cx = inner.x + inner.w / 2;
    const cy = inner.y + inner.h / 2;

    return [
      { x1: cx, y1: outer.y, x2: cx, y2: inner.y, value: inner.y - outer.y },
      { x1: cx, y1: inner.y + inner.h, x2: cx, y2: outer.y + outer.h, value: outer.y + outer.h - inner.y - inner.h },
      { x1: outer.x, y1: cy, x2: inner.x, y2: cy, value: inner.x - outer.x },
      { x1: inner.x + inner.w, y1: cy, x2: outer.x + outer.w, y2: cy, value: outer.x + outer.w - inner.x - inner.w },
    ].filter((l) => l.value > 0.5);
  }
  const out: Line[] = [];
  // side by side: the horizontal gap, drawn where the two overlap vertically (or level with the first box)
  const [left, right] = a.x + a.w <= b.x ? [a, b] : b.x + b.w <= a.x ? [b, a] : [null, null];

  if (left && right) {
    const top = Math.max(left.y, right.y);
    const bottom = Math.min(left.y + left.h, right.y + right.h);
    const y = top < bottom ? (top + bottom) / 2 : left.y + left.h / 2;

    out.push({ x1: left.x + left.w, y1: y, x2: right.x, y2: y, value: right.x - left.x - left.w });
  }
  const [upper, lower] = a.y + a.h <= b.y ? [a, b] : b.y + b.h <= a.y ? [b, a] : [null, null];

  if (upper && lower) {
    const l = Math.max(upper.x, lower.x);
    const r = Math.min(upper.x + upper.w, lower.x + lower.w);
    const x = l < r ? (l + r) / 2 : upper.x + upper.w / 2;

    out.push({ x1: x, y1: upper.y + upper.h, x2: x, y2: lower.y, value: lower.y - upper.y - upper.h });
  }

  return out;
};

/** The deepest element of `root` under the point, the last painted one winning; for screens on the board, which are inert to the pointer. */
const deepestAt = (root: Element, x: number, y: number): Element | null => {
  let found: Element | null = null;
  const walk = (el: Element) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();

      if (r.width && r.height && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        found = c;
        walk(c);
      }
    }
  };

  walk(root);

  return found;
};

/** How much a screen is scaled on the page (a page zoomed out in the prototype, a card on the board): drawn width over its own. */
const scaleOf = (el: Element) => {
  const screen = el.closest<HTMLElement>('.pd-card__inner, .pd-stage__frame');

  return screen?.offsetWidth ? screen.getBoundingClientRect().width / screen.offsetWidth : 1;
};

/**
 * Dev mode: hover an element of a screen to see its size and its distances to the edges of the element around it, in the
 * design's own pixels. A distance that equals a spacing token is named by the token, which is what the developer should
 * use. On the prototype a click picks an element, then hovering another shows the distance between the two (clicks pick
 * instead of navigating while dev mode is on). On the board the screens are small copies: hovering measures, a click
 * still selects the screen.
 */
export const Measure = ({ host, on }: { host: RefObject<HTMLElement | null>; on: 'prototype' | 'board' }) => {
  const { ds } = useViewer();
  const [hovered, setHovered] = useState<Element | null>(null);
  const [picked, setPicked] = useState<Element | null>(null);
  const [, redraw] = useState(0);
  const layer = useRef<SVGSVGElement>(null);
  const spacing = useMemo(() => {
    const byPx = new Map<number, string>();

    for (const tk of ds.report.tokens.space ?? []) {
      const m = /^(-?[\d.]+)(px|rem)$/.exec(tk.value.trim());

      if (m) byPx.set(Math.round(Number(m[1]) * (m[2] === 'rem' ? 16 : 1)), tk.name);
    }

    return byPx;
  }, [ds]);

  useEffect(() => {
    const el = host.current;

    if (!el || on !== 'board') return;
    const move = (e: PointerEvent) => {
      const card = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-card]');
      const screen = card?.querySelector('.pd-card__inner');

      setHovered(screen ? deepestAt(screen, e.clientX, e.clientY) : null);
    };
    // the camera moves the screens: measure again once the pointer moves
    const clear = () => setHovered(null);

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', clear);
    el.addEventListener('wheel', clear, { passive: true });
    el.addEventListener('pointerdown', clear);

    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', clear);
      el.removeEventListener('wheel', clear);
      el.removeEventListener('pointerdown', clear);
    };
  }, [host, on]);

  useEffect(() => {
    const root = on === 'prototype' ? host.current?.querySelector<HTMLElement>('.pd-stage__frame') : null;

    if (!root) return;
    const inside = (e: Event) =>
      e.target instanceof Element && root.contains(e.target) && e.target !== root ? e.target : null;
    const move = (e: PointerEvent) => setHovered(inside(e));
    const leave = () => setHovered(null);
    const click = (e: MouseEvent) => {
      const target = inside(e);

      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      setPicked((p) => (p === target ? null : target));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicked(null);
    };
    // the screen scrolls inside its frame: the boxes move with it
    const scroll = () => redraw((n) => n + 1);

    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('click', click, true);
    root.addEventListener('scroll', scroll, true);
    window.addEventListener('keydown', key);

    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('click', click, true);
      root.removeEventListener('scroll', scroll, true);
      window.removeEventListener('keydown', key);
    };
  }, [host, on]);

  const origin = layer.current?.getBoundingClientRect();

  if (!origin || !hovered) return <svg ref={layer} className="pd-measure" aria-hidden="true" />;
  const h = boxOf(hovered, origin);
  const ref =
    picked && picked !== hovered
      ? boxOf(picked, origin)
      : hovered.parentElement
        ? boxOf(hovered.parentElement, origin)
        : null;
  const lines = ref ? distances(ref, h) : [];
  // on-screen pixels back to the design's own
  const zoom = scaleOf(hovered);
  const px = (v: number) => Math.round(v / zoom);
  const label = (v: number) => {
    const n = px(v);
    const token = spacing.get(n);

    return token ? `${n} · ${token}` : String(n);
  };

  return (
    <svg ref={layer} className="pd-measure" aria-hidden="true">
      {picked && picked !== hovered && ref && (
        <rect className="pd-measure__picked" x={ref.x} y={ref.y} width={ref.w} height={ref.h} />
      )}
      <rect className="pd-measure__box" x={h.x} y={h.y} width={h.w} height={h.h} />
      {lines.map((l, i) => {
        const text = label(l.value);
        const mx = (l.x1 + l.x2) / 2;
        const my = (l.y1 + l.y2) / 2;
        const w = text.length * 6.4 + 10;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: the lines are measured again on every move, never reordered
          <g key={i}>
            <line className="pd-measure__line" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            <rect className="pd-measure__tag" x={mx - w / 2} y={my - 9} width={w} height={18} rx={4} />
            <text className="pd-measure__text" x={mx} y={my + 4}>
              {text}
            </text>
          </g>
        );
      })}
      <g>
        <rect className="pd-measure__size" x={h.x + h.w / 2 - 40} y={h.y + h.h + 4} width={80} height={18} rx={4} />
        <text className="pd-measure__text" x={h.x + h.w / 2} y={h.y + h.h + 17}>
          {px(h.w)} × {px(h.h)}
        </text>
      </g>
    </svg>
  );
};
