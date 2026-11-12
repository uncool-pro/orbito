import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import type { Status } from '@uncool-pro/orbito-core';

import { recall, remember } from '../../remembered';

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
  /** Dev mode: the screen's code, real paths and distances, for whoever builds the product. Remembered on this computer. */
  devMode: boolean;
  toggleDev: () => void;
  /** Width of the right panel while it shows code (dev mode), dragged at its edge. */
  codeWidth: number;
  setCodeWidth: (w: number) => void;
  /** The screen whose comments show in the bubble next to it (board or prototype), or null. */
  commentsOn: string | null;
  openComments: (id: string | null) => void;
};

const ShellContext = createContext<Shell | null>(null);

export const useShell = (): Shell => {
  const s = useContext(ShellContext);

  if (!s) throw new Error('orbito: shell context missing');

  return s;
};

const narrow = () => typeof window !== 'undefined' && window.innerWidth < 900;

export const ShellProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [options, setOpts] = useState<ViewOptions>(() => ({
    statusFilter: '',
    showClosed: false,
    showOther: false,
    wheelZooms: recall('pd.wheelZooms') === '1',
  }));
  const [drawerOpen, setDrawer] = useState(() => !narrow());
  const [inspectorOpen, setInspector] = useState(() => !narrow());
  const [devMode, setDev] = useState(() => recall('pd.devMode') === '1');
  const [codeWidth, setWidth] = useState(() => Number(recall('pd.codeWidth')) || 420);
  const [commentsOn, openComments] = useState<string | null>(null);
  const canvas = useRef<CanvasApi | null>(null);

  const select = useCallback((id: string | null, opts?: { focus?: boolean }) => {
    setSelected(id);
    if (opts?.focus) setFocusTick((n) => n + 1);
  }, []);
  const setOptions = useCallback((patch: Partial<ViewOptions>) => {
    setOpts((o) => {
      const next = { ...o, ...patch };

      remember('pd.wheelZooms', next.wheelZooms ? '1' : '0');

      return next;
    });
  }, []);
  const toggleDev = useCallback(
    () =>
      setDev((v) => {
        remember('pd.devMode', v ? '0' : '1');

        return !v;
      }),
    [],
  );
  const setCodeWidth = useCallback((w: number) => {
    setWidth(w);
    remember('pd.codeWidth', String(w));
  }, []);
  const togglePanel = useCallback(
    (which: 'drawer' | 'inspector') => (which === 'drawer' ? setDrawer((v) => !v) : setInspector((v) => !v)),
    [],
  );

  const value = useMemo(
    () => ({
      selected,
      select,
      focusTick,
      options,
      setOptions,
      canvas,
      drawerOpen,
      inspectorOpen,
      togglePanel,
      devMode,
      toggleDev,
      codeWidth,
      setCodeWidth,
      commentsOn,
      openComments,
    }),
    [
      selected,
      select,
      focusTick,
      options,
      setOptions,
      drawerOpen,
      inspectorOpen,
      togglePanel,
      devMode,
      toggleDev,
      codeWidth,
      setCodeWidth,
      commentsOn,
    ],
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
