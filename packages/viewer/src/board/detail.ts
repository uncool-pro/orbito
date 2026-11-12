/**
 * Level of detail of the board: far away, the screens are drawn without the blur behind frosted glass.
 *
 * This is the one place where Orbito draws a screen differently from its design, and only where it does not matter:
 * below half the real size a board is used to move around and to see the whole, not to read screens (what is on a
 * screen starts to be recognisable at about half its size), and the blur behind a glass bar goes unnoticed there.
 * What it buys is real. Every element with `backdrop-filter` is a pass of its own for the graphics card on every
 * frame, however small it is drawn, and zoomed out there are hundreds of them in view: on a laptop's built-in graphics
 * the board stutters there and nowhere else. Measured with scripts/perf (84 screens in view on a 5K-sized window,
 * swept left and right): frames the graphics card dropped, 17 with the blur and 3 without.
 * From half the real size up, a screen is always drawn in full; the prototype, the details and the catalog always
 * are. Shadows, gradients and everything else stay: they are drawn once and cost nothing while moving.
 *
 * The thresholds are Jakub's (11.11.2026: first a quarter, then half after trying it on a big project).
 */
export const FAR_BELOW = 0.5;
/** Back to full detail a little above the point where it was left, so a zoom resting on the edge does not flicker. */
export const NEAR_FROM = 0.55;

/** Whether the board is far away at zoom `k`, given whether it was a moment ago. */
export const isFar = (k: number, wasFar: boolean) => k < (wasFar ? NEAR_FROM : FAR_BELOW);
