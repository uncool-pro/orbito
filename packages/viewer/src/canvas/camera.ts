/**
 * Camera math for the board: pure functions, no DOM, fully unit-tested.
 * A camera maps world coordinates to screen coordinates: screen = world * k + (x, y).
 */
export type Camera = { x: number; y: number; k: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };

export const ZOOM = { min: 0.05, max: 3 } as const;

const clampK = (k: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, k));

export const screenToWorld = (c: Camera, sx: number, sy: number) => ({ x: (sx - c.x) / c.k, y: (sy - c.y) / c.k });

/** Zooms by `factor` keeping the world point under the screen point (sx, sy) where it is. */
export const zoomAt = (c: Camera, factor: number, sx: number, sy: number): Camera => {
  const k = clampK(c.k * factor);
  const f = k / c.k;

  return { k, x: sx - (sx - c.x) * f, y: sy - (sy - c.y) * f };
};

/** Zooms to an absolute level around a screen point. */
export const zoomTo = (c: Camera, k: number, sx: number, sy: number): Camera => zoomAt(c, clampK(k) / c.k, sx, sy);

export const panBy = (c: Camera, dx: number, dy: number): Camera => ({ ...c, x: c.x + dx, y: c.y + dy });

/** Camera that shows `r` whole inside `view` (minus `inset` at the top for the toolbar), never zoomed in past `maxK`. */
export const fitRect = (r: Rect, view: Size, { pad = 48, inset = 0, maxK = 1 } = {}): Camera => {
  const aw = Math.max(1, view.w - pad * 2);
  const ah = Math.max(1, view.h - inset - pad * 2);
  const k = clampK(Math.min(maxK, aw / Math.max(1, r.w), ah / Math.max(1, r.h)));

  return { k, x: (view.w - r.w * k) / 2 - r.x * k, y: inset + (view.h - inset - r.h * k) / 2 - r.y * k };
};

/** Centres the rect in the view at zoom `k` (default: current, but at least `minK` so the target is readable). */
export const centerOn = (c: Camera, r: Rect, view: Size, minK = 0.6): Camera => {
  const k = clampK(Math.max(c.k, minK));

  return { k, x: view.w / 2 - (r.x + r.w / 2) * k, y: view.h / 2 - (r.y + r.h / 2) * k };
};

/** The part of the world that is on screen, grown by `margin` screen pixels on every side. */
export const visibleWorld = (c: Camera, view: Size, margin = 0): Rect => {
  const a = screenToWorld(c, -margin, -margin);
  const b = screenToWorld(c, view.w + margin, view.h + margin);

  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
};

export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// ---- wheel input

export type WheelLike = { deltaX: number; deltaY: number; deltaMode: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };

const LINE = 16;

/** Wheel deltas in pixels (Firefox reports lines or pages); Shift turns a vertical mouse wheel into horizontal. */
export const wheelPixels = (e: WheelLike, pageH: number) => {
  const unit = e.deltaMode === 1 ? LINE : e.deltaMode === 2 ? pageH : 1;
  let dx = e.deltaX * unit;
  let dy = e.deltaY * unit;

  if (e.shiftKey && dx === 0) [dx, dy] = [dy, 0];

  return { dx, dy };
};

/**
 * What a wheel event means on the board:
 * - pinch on a trackpad arrives as wheel + ctrlKey, and Ctrl/⌘ + wheel is the universal zoom gesture -> `zoom`;
 * - everything else pans (two-finger scroll on a trackpad, mouse wheel), unless the user prefers the mouse wheel to zoom
 *   and the event looks like a notched mouse wheel (line mode, or a large integer step with no horizontal part).
 */
export const wheelIntent = (e: WheelLike, prefs: { wheelZooms: boolean }): 'zoom' | 'pan' => {
  if (e.ctrlKey || e.metaKey) return 'zoom';
  if (!prefs.wheelZooms) return 'pan';
  const notched = e.deltaMode !== 0 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);

  return notched ? 'zoom' : 'pan';
};

/** Zoom factor for a wheel delta; pinch deltas are small and frequent, mouse notches large and rare. */
export const wheelZoomFactor = (dy: number, pinch: boolean) => Math.exp(-dy * (pinch ? 0.01 : 0.0022));
