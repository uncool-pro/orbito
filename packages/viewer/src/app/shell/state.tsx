import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import type { Status } from '@uncool-pro/orbito-core';

/**
 * State shared by the whole app shell, so it survives switching between board, flows and prototype:
 * the selected screen, view options, the active canvas (zoom controls of the island) and panel visibility.
 */
export type ViewOptions = { statusFilter: Status | ''; showClosed: boolean; showOther: boolean; wheelZooms: boolean };

/** What the island's zoom controls drive: registered by the board or the flows diagram while it is shown. */
export type CanvasApi = { zoomBy: (factor: number) => void; fit: () => void };

type Shell = {
  selected: string | null;
  /** Select a screen; `focus` also asks the canvas to bring it into view. */
  select: (id: string | null, opts?: { focus?: boolean }) => void;
  /** Increments on every focus request; canvases react to it. */
  focusTick: number;
  options: ViewOptions;
  setOptions: (patch: Partial<ViewOptions>) => void;
  canvas: { current: CanvasApi | null };
  drawerOpen: boolean;
  inspectorOpen: boolean;
  togglePanel: (which: 'drawer' | 'inspector') => void;
};

const ShellContext = createContext<Shell | null>(null);

export const useShell = (): Shell => {
  const s = useContext(ShellContext);

  if (!s) throw new Error('orbito: shell context missing');

  return s;
};

const readWheel = () => {
  try {
    return localStorage.getItem('pd.wheelZooms') === '1';
  } catch {
    return false;
  }
};

const narrow = () => typeof window !== 'undefined' && window.innerWidth < 900;

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [options, setOpts] = useState<ViewOptions>(() => ({ statusFilter: '', showClosed: false, showOther: false, wheelZooms: readWheel() }));
  const [drawerOpen, setDrawer] = useState(() => !narrow());
  const [inspectorOpen, setInspector] = useState(() => !narrow());
  const canvas = useRef<CanvasApi | null>(null);

  const select = useCallback((id: string | null, opts?: { focus?: boolean }) => {
    setSelected(id);
    if (opts?.focus) setFocusTick((n) => n + 1);
  }, []);
  const setOptions = useCallback((patch: Partial<ViewOptions>) => {
    setOpts((o) => {
      const next = { ...o, ...patch };

      try {
        localStorage.setItem('pd.wheelZooms', next.wheelZooms ? '1' : '0');
      } catch {
        /* storage unavailable */
      }

      return next;
    });
  }, []);
  const togglePanel = useCallback((which: 'drawer' | 'inspector') => (which === 'drawer' ? setDrawer((v) => !v) : setInspector((v) => !v)), []);

  const value = useMemo(
    () => ({ selected, select, focusTick, options, setOptions, canvas, drawerOpen, inspectorOpen, togglePanel }),
    [selected, select, focusTick, options, setOptions, drawerOpen, inspectorOpen, togglePanel],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
};

// ---- zoom level: written by canvases every frame, read by the island; kept outside React state so panning never re-renders the app
let zoom = 1;
const zoomSubs = new Set<() => void>();

export const setZoom = (k: number) => {
  if (Math.abs(k - zoom) < 0.001) return;
  zoom = k;
  zoomSubs.forEach((f) => f());
};

export const useZoom = () =>
  useSyncExternalStore(
    (f) => {
      zoomSubs.add(f);

      return () => zoomSubs.delete(f);
    },
    () => zoom,
  );

// ---- extra inspector content a view provides when nothing is selected (legend, findings)
let extra: ReactNode = null;
const extraSubs = new Set<() => void>();

export const setInspectorExtra = (node: ReactNode) => {
  extra = node;
  extraSubs.forEach((f) => f());
};

export const useInspectorExtra = () =>
  useSyncExternalStore(
    (f) => {
      extraSubs.add(f);

      return () => extraSubs.delete(f);
    },
    () => extra,
  );
