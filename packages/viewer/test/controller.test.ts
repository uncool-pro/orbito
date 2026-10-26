import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CanvasController } from '../src/canvas/controller';

// a board element without a DOM: just what the controller touches
const board = () => {
  const el = new EventTarget() as EventTarget & Record<string, unknown>;
  const captured = new Set<number>();

  Object.assign(el, {
    clientWidth: 800,
    clientHeight: 600,
    classList: { add: vi.fn(), remove: vi.fn() },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    setPointerCapture: vi.fn((id: number) => captured.add(id)),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  });

  return el as unknown as HTMLElement & { setPointerCapture: ReturnType<typeof vi.fn> };
};
const pointer = (type: string, x: number, y: number) =>
  Object.assign(new Event(type), { pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y });

let el: ReturnType<typeof board>;
let ctrl: CanvasController;

beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => (f(), 1));
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  el = board();
  ctrl = new CanvasController(el, { initial: { x: 0, y: 0, k: 1 }, onChange: () => undefined, scrollerAt: () => null, isUi: () => false, prefs: () => ({ wheelZooms: false }) });
});
afterEach(() => {
  ctrl.destroy();
  vi.unstubAllGlobals();
});

const press = (x: number, y: number) => el.dispatchEvent(pointer('pointerdown', x, y));

describe('board input', () => {
  it('does not take the pointer on a plain press, so the click lands on the screen under the cursor', () => {
    press(100, 100);
    el.dispatchEvent(pointer('pointermove', 101, 101));
    el.dispatchEvent(pointer('pointerup', 101, 101));

    expect(el.setPointerCapture).not.toHaveBeenCalled();
    expect(ctrl.consumeDrag()).toBe(false);
  });

  it('takes the pointer once a drag starts, and the click after a drag opens nothing', () => {
    press(100, 100);
    el.dispatchEvent(pointer('pointermove', 140, 120));
    el.dispatchEvent(pointer('pointerup', 140, 120));

    expect(el.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(ctrl.consumeDrag()).toBe(true);
  });
});
