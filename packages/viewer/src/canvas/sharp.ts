import type { Camera } from './camera';

type Styled = { style: Pick<CSSStyleDeclaration, 'willChange' | 'transform'> };

/**
 * Places the world under the camera, smooth while it moves and sharp once it stops.
 *
 * The world is one GPU layer (`will-change`, a 3D transform): panning and zooming only move a picture, at full frame
 * rate. The browser draws a layer like that once, at the zoom it had when it became a layer, and keeps that picture, so
 * after zooming in the screens look blurry. Once the camera has been still for `delay` ms at a new zoom, the world stops
 * being a layer for a moment (the browser draws it again, crisp at this zoom) and becomes one again on the next frames.
 *
 * Panning keeps the zoom, so it never redraws anything: the picture is already sharp at that zoom. Before, every stop
 * redrew every live screen on the board, also after a plain pan, and a trackpad stops many times a second.
 */
export const sharpWhenStill = (world: Styled, delay = 150) => {
  let timer = 0;
  let frame = 0;
  let drawnAt: number | null = null;
  let last: Camera | null = null;
  const asLayer = (c: Camera) => {
    world.style.willChange = 'transform';
    world.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.k})`;
  };

  return (c: Camera) => {
    last = c;
    drawnAt ??= c.k;
    window.cancelAnimationFrame(frame);
    asLayer(c);
    window.clearTimeout(timer);
    if (c.k === drawnAt) return;
    timer = window.setTimeout(() => {
      world.style.willChange = 'auto';
      world.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`;
      drawnAt = c.k;
      // two frames: the first one paints the world crisp, the next makes it a layer again, drawn at this zoom
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => last && asLayer(last));
      });
    }, delay);
  };
};
