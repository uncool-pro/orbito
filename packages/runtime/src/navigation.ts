/**
 * Prototype navigation. Screens live at `#/s/<id>`; the viewer owns the routes, screens only call `goTo` / `goBack`
 * (usually through `<Link>`), so a screen never needs to know where it is shown.
 */
export const screenHash = (id: string) => `#/s/${encodeURIComponent(id)}`;

let parents: Record<string, string | undefined> = {};

/** Registers each screen's logical parent (`meta.back`). Called by the viewer. */
export const registerParents = (screens: { id: string; back?: string }[]) => {
  parents = Object.fromEntries(screens.map((s) => [s.id, s.back]));
};

export const currentScreenId = (): string | undefined => {
  const m = /^#\/s\/([^?]+)/.exec(window.location.hash);

  return m ? decodeURIComponent(m[1]!) : undefined;
};

export const goTo = (id: string) => {
  window.location.hash = screenHash(id);
};

/** Logical back: the screen's parent if it has one, otherwise browser history. */
export const goBack = () => {
  const id = currentScreenId();
  const parent = id ? parents[id] : undefined;

  if (parent) goTo(parent);
  else window.history.back();
};
