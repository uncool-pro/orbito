import type { Camera } from './camera';

/**
 * Places the world under the camera, smooth while it moves and sharp once it stops.
 *
 * While the camera moves, the world is one GPU layer (`will-change`, a 3D transform): panning and zooming only move a
 * picture, at full frame rate. A layer like that keeps the resolution it was drawn at, so screens zoomed in look blurry.
 * Once the camera has been still for `delay` ms, the hint goes and the transform becomes 2D: the browser redraws the
 * screens at the current zoom, crisp at any size.
 */
export const sharpWhenStill = (world: HTMLElement, delay = 150) => {
  let timer = 0;

  return (c: Camera) => {
    world.style.willChange = 'transform';
    world.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.k})`;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      world.style.willChange = 'auto';
      world.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`;
    }, delay);
  };
};
