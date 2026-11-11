import type { Camera } from './camera';

type Styled = { style: Pick<CSSStyleDeclaration, 'transform'> };

/**
 * Places the world under the camera: one plain 2D transform, and nothing else.
 *
 * The world is deliberately NOT made a GPU layer (`will-change`, `translate3d`). It used to be one while the camera
 * moved, on the usual advice that a layer only has to be moved, not redrawn. On a board of real screens that advice is
 * wrong twice. The browser keeps the picture of a layer at the zoom it was drawn at, so screens were blurry after
 * zooming in and had to be redrawn every time the camera stopped. And every element inside the layer that is a layer
 * itself (frosted glass, `backdrop-filter`, in a tab bar or a card) made the browser arrange all layers again on every
 * frame of a move: with a few dozen such screens, panning dropped to 12 frames a second. Left alone, the browser moves
 * the world just as cheaply, draws it sharp at every zoom, and the glass costs nothing extra.
 * Measured with scripts/perf on 360 screens: 51 stutters while panning zoomed out, none without the layer.
 */
export const placeWorld = (world: Styled) => (c: Camera) => {
  world.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`;
};
