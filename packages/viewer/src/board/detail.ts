/**
 * Level of detail of the board: far away, the screens are drawn without the blur behind frosted glass.
 *
 * This is the one place where Orbito draws a screen differently from its design, and only where the difference cannot
 * be seen: below a quarter of the real size a phone screen is under a hundred pixels wide, and the 18 px blur of a
 * glass bar is 4 px or less. What it buys is real. Every element with `backdrop-filter` is a pass of its own for the
 * graphics card on every frame, however small it is drawn, and zoomed out there are hundreds of them in view: on a
 * laptop's built-in graphics the board stutters there and nowhere else. Measured with scripts/perf (84 screens in
 * view on a 5K-sized window, swept left and right): frames the graphics card dropped, 17 with the blur and 3 without.
 * From a quarter of the real size up, a screen is always drawn in full; the prototype, the details and the catalog
 * always are. Shadows, gradients and everything else stay: they are drawn once and cost nothing while moving.
 */
export const FAR_BELOW = 0.25;
/** Back to full detail a little above the point where it was left, so a zoom resting on the edge does not flicker. */
export const NEAR_FROM = 0.28;

/** Whether the board is far away at zoom `k`, given whether it was a moment ago. */
export const isFar = (k: number, wasFar: boolean) => k < (wasFar ? NEAR_FROM : FAR_BELOW);
