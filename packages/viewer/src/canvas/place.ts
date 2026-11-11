import type { Camera } from './camera';

type World = {
  style: Pick<CSSStyleDeclaration, 'transform'>;
  animate?: HTMLElement['animate'];
};

export type Placer = {
  /** Puts the world under the camera. */
  place: (c: Camera) => void;
  /** Lets go of the world (when the view goes away). */
  release: () => void;
};

/**
 * Places the world under the camera, through a paused animation whose value follows the camera.
 *
 * Why not just set `style.transform`: frosted glass. Every element of a screen with `backdrop-filter` (a tab bar, a
 * card) is a layer of its own for the browser. When the transform of the world changes through its style, Chrome
 * arranges all layers again ("Layerize") on every frame, about 0.2 ms for each glass element in view: with a hundred
 * screens in view that is one frame in five. Chrome skips that work only for an element whose transform is animated,
 * so the camera is an animation that never runs: it is paused, and each camera change rewrites its keyframes.
 * The world is not given `will-change`: with it the browser keeps the picture it drew once and stretches it, and the
 * screens turn blurry when you zoom in. Like this they are redrawn sharp at every zoom.
 *
 * Measured with scripts/perf in a window the size of a 5K display, the whole page in view and swept left and right:
 * 84 cards, 202 stutters with the style, none like this; 336 cards, 213 against 29.
 * The price: any repaint of the board (a highlight, a selection) arranges the layers once. The highlight of related
 * screens therefore has no fade (a fade repaints for eight frames); it still answers the pointer at once.
 * Where animations are missing (an old browser, a test) the transform is set through the style.
 */
export const placeWorld = (world: World): Placer => {
  const camera =
    typeof world.animate === 'function'
      ? world.animate([{ transform: 'none' }, { transform: 'none' }], { duration: 1e9, fill: 'both' })
      : null;

  camera?.pause();

  return {
    place: (c) => {
      const transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`;

      if (camera) (camera.effect as KeyframeEffect).setKeyframes([{ transform }, { transform }]);
      else world.style.transform = transform;
    },
    release: () => camera?.cancel(),
  };
};
