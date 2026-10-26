import { panBy, wheelIntent, wheelPixels, wheelZoomFactor, zoomAt } from './camera';
import type { Camera } from './camera';

/** A scrollable element inside the active card, with the total scale between screen pixels and its own pixels. */
export type Scroller = { el: HTMLElement; scale: number };

export type ControllerOptions = {
  initial: Camera;
  /** Called at most once per animation frame with the latest camera. */
  onChange: (c: Camera) => void;
  /** The scroll area to drive when the pointer is over the active card, or null. */
  scrollerAt: (target: Element) => Scroller | null;
  /** Tool UI (toolbar, menus): the board leaves those events alone. */
  isUi: (target: Element) => boolean;
  prefs: () => { wheelZooms: boolean };
};

type Drag = { id: number; mode: 'pan' | 'scroll'; lastX: number; lastY: number; startX: number; startY: number; scroller?: Scroller };

const DRAG_SLOP = 4;

/**
 * Turns pointer, wheel and keyboard input into camera moves. One rule per gesture, the same everywhere on the board:
 * - drag anywhere (cards included) pans; middle button or Space + drag always pans;
 * - drag inside the active card scrolls that screen, like a finger on a phone;
 * - two-finger scroll / mouse wheel pans; pinch or Ctrl/⌘ + wheel zooms at the cursor;
 * - over the active card the wheel scrolls the screen instead.
 * Pointer capture keeps a drag alive outside the window; right clicks, blur and lost capture never leave a drag behind.
 */
export class CanvasController {
  camera: Camera;
  private el: HTMLElement;
  private opts: ControllerOptions;
  private drag: Drag | null = null;
  private touches = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private space = false;
  private dragged = false;
  private frame = 0;
  private off: (() => void)[] = [];

  constructor(el: HTMLElement, opts: ControllerOptions) {
    this.el = el;
    this.opts = opts;
    this.camera = opts.initial;
    this.listen(el, 'wheel', this.onWheel as EventListener, { passive: false });
    this.listen(el, 'pointerdown', this.onDown as EventListener);
    this.listen(el, 'pointermove', this.onMove as EventListener);
    this.listen(el, 'pointerup', this.onUp as EventListener);
    this.listen(el, 'pointercancel', this.onUp as EventListener);
    this.listen(el, 'lostpointercapture', this.onUp as EventListener);
    this.listen(window, 'keydown', this.onKey as EventListener);
    this.listen(window, 'keyup', this.onKey as EventListener);
    this.listen(window, 'blur', this.reset);
    // Safari sends its own gesture events for trackpad pinch; the wheel path handles zoom, so stop page zoom here
    this.listen(el, 'gesturestart', ((e: Event) => e.preventDefault()) as EventListener);
  }

  /** True right after a pointer sequence that moved: the click that follows must not open or select anything. */
  consumeDrag() {
    const d = this.dragged;

    this.dragged = false;

    return d;
  }

  set(c: Camera) {
    this.camera = c;
    this.schedule();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.off.forEach((f) => f());
  }

  private listen(t: EventTarget, type: string, fn: EventListener, o?: AddEventListenerOptions) {
    t.addEventListener(type, fn, o);
    this.off.push(() => t.removeEventListener(type, fn, o));
  }

  private schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.opts.onChange(this.camera);
    });
  }

  private local(e: { clientX: number; clientY: number }) {
    const r = this.el.getBoundingClientRect();

    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private reset = () => {
    this.drag = null;
    this.touches.clear();
    this.pinchDist = 0;
    this.setSpace(false);
  };

  private setSpace(on: boolean) {
    this.space = on;
    this.el.classList.toggle('is-space', on);
  }

  private onWheel = (e: WheelEvent) => {
    const target = e.target as Element;

    if (this.opts.isUi(target)) return;
    e.preventDefault();
    const { dx, dy } = wheelPixels(e, this.el.clientHeight);
    const sc = e.ctrlKey || e.metaKey ? null : this.opts.scrollerAt(target);

    if (sc) {
      sc.el.scrollTop += dy / sc.scale;
      sc.el.scrollLeft += dx / sc.scale;

      return;
    }
    if (wheelIntent(e, this.opts.prefs()) === 'zoom') {
      const p = this.local(e);

      this.camera = zoomAt(this.camera, wheelZoomFactor(dy || dx, e.ctrlKey && e.deltaMode === 0 && !Number.isInteger(e.deltaY)), p.x, p.y);
    } else this.camera = panBy(this.camera, -dx, -dy);
    this.schedule();
  };

  private onDown = (e: PointerEvent) => {
    const target = e.target as Element;

    if (this.opts.isUi(target)) return;
    if (e.pointerType === 'touch') {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touches.size === 2) {
        const [a, b] = [...this.touches.values()];

        this.pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        this.drag = null; // a second finger turns the gesture into a pinch
        this.dragged = true;

        return;
      }
    }
    if (e.button !== 0 && e.button !== 1) return; // right click opens the context menu and must not start anything
    if (e.button === 1) e.preventDefault(); // no autoscroll
    const sc = e.button === 0 && !this.space ? this.opts.scrollerAt(target) : null;

    this.drag = { id: e.pointerId, mode: sc ? 'scroll' : 'pan', lastX: e.clientX, lastY: e.clientY, startX: e.clientX, startY: e.clientY, scroller: sc ?? undefined };
    this.dragged = false;
    // no pointer capture yet: a capture taken on press makes browsers deliver the click to the board instead of the card
    // under the cursor, so a plain click on a screen would never open it; capture starts with the drag (onMove)
  };

  private onMove = (e: PointerEvent) => {
    if (this.touches.has(e.pointerId)) this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size === 2) {
      const [a, b] = [...this.touches.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const mid = this.local({ clientX: (a!.x + b!.x) / 2, clientY: (a!.y + b!.y) / 2 });

      if (this.pinchDist) this.camera = zoomAt(this.camera, dist / this.pinchDist, mid.x, mid.y);
      this.pinchDist = dist;
      this.schedule();

      return;
    }
    const d = this.drag;

    if (!d || d.id !== e.pointerId) return;
    if (!this.dragged && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_SLOP) return;
    if (!this.dragged) {
      try {
        this.el.setPointerCapture(e.pointerId); // keeps the drag alive outside the window
      } catch {
        /* pointer already gone (e.g. synthetic events) */
      }
    }
    this.dragged = true;
    this.el.classList.add('is-dragging');
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;

    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (d.mode === 'scroll' && d.scroller) {
      d.scroller.el.scrollTop -= dy / d.scroller.scale;
      d.scroller.el.scrollLeft -= dx / d.scroller.scale;

      return;
    }
    this.camera = panBy(this.camera, dx, dy);
    this.schedule();
  };

  private onUp = (e: PointerEvent) => {
    this.touches.delete(e.pointerId);
    if (this.touches.size < 2) this.pinchDist = 0;
    if (this.drag?.id === e.pointerId) {
      this.drag = null;
      this.el.classList.remove('is-dragging');
      if (this.el.hasPointerCapture(e.pointerId)) this.el.releasePointerCapture(e.pointerId);
    }
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== ' ') return;
    const t = e.target as HTMLElement | null;

    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    this.setSpace(e.type === 'keydown');
  };
}
