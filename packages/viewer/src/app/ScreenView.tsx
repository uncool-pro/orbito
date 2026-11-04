import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import type { Screen, Viewport } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

import { pathOnComputer, useDevEnv, vscodeLink } from '../dev';
import { useT } from '../i18n';
import { recall, remember } from '../remembered';
import { useOpenCount } from '../comments';
import { Icon } from './icons';
import { ErrorBoundary } from './ErrorBoundary';
import { Measure } from './Measure';
import { useViewer } from './context';
import { useShell } from './shell/state';

// room the side panels and the stage padding take from the window
const CHROME = 640;
const SIZE_KEY = 'pd.viewport';
const PHONE_KEY = 'pd.phone';
// a phone screen is also shown on the smallest and the largest phone, around the size it was designed for
const PHONES = { small: 'mobile-small', large: 'mobile-large' } as const;

const useWindowWidth = () => {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const on = () => setW(window.innerWidth);

    window.addEventListener('resize', on);

    return () => window.removeEventListener('resize', on);
  }, []);

  return w;
};

const Frame = ({ screen, vp, zoom }: { screen: Screen<ComponentType>; vp: Viewport; zoom: number }) => {
  const S = screen.component;

  return (
    <div className="pd-stage__frame" data-comment-anchor={screen.id} style={{ zoom }}>
      <FrameContext.Provider value={{ mode: 'screen', viewport: vp }}>
        <ErrorBoundary name={screen.code ?? screen.id}>
          <S />
        </ErrorBoundary>
      </FrameContext.Provider>
    </div>
  );
};

// a monitor, a tablet or a phone, by the size's width
const SizeIcon = ({ width }: { width: number }) => <Icon name={width >= 1024 ? 'monitor' : width >= 600 ? 'tablet' : 'smartphone'} size={15} />;

type Size = { vp: Viewport; label: string; key: string };

/**
 * The sizes the prototype offers for a screen: the sizes of a responsive page, or a phone screen on a small, its own and a
 * large phone. Anything else has one size and no switch.
 */
const sizesOf = (screen: Screen<ComponentType>, viewports: Record<string, Viewport>, phoneLabel: Record<string, string>): { sizes: Size[]; store: string } => {
  if (screen.viewports?.length)
    return { sizes: screen.viewports.map((k) => viewports[k]!).filter(Boolean).map((vp) => ({ vp, key: vp.key, label: vp.label.replace(/ web$/i, '') })), store: SIZE_KEY };
  const own = viewports[screen.viewport!]!;
  const small = viewports[PHONES.small];
  const large = viewports[PHONES.large];

  if (own.kind !== 'device' || own.width >= 600 || !small || !large) return { sizes: [{ vp: own, key: own.key, label: own.label }], store: SIZE_KEY };

  return {
    sizes: [
      { vp: small, key: 'small', label: phoneLabel.small! },
      { vp: own, key: 'standard', label: phoneLabel.standard! },
      { vp: large, key: 'large', label: phoneLabel.large! },
    ],
    store: PHONE_KEY,
  };
};

/**
 * Prototype mode: one screen, clickable like the real product; its links navigate, the inspector follows.
 * A responsive page (`viewports` in its meta) is shown at one size at a time, as big as the stage allows; a phone screen can
 * be seen on a small and a large phone too. The switch in the top right corner changes the size, and the choice stays while
 * you click through the prototype. Dev mode adds the file's path above the screen and measuring on it; the code is in the right panel.
 */
export const ScreenView = ({ screen }: { screen: Screen<ComponentType> }) => {
  const { project } = useViewer();
  const { select, devMode, codeWidth, inspectorOpen, commentsOn, openComments } = useShell();
  const t = useT();
  const width = useWindowWidth();
  const { sizes, store } = sizesOf(screen, project.viewports, t.phoneLabel);
  const [chosen, setChosen] = useState(() => recall(store));
  const size = sizes.find((s) => s.key === chosen) ?? sizes.find((s) => s.key === 'standard') ?? sizes[0]!;
  const vp = size.vp;
  const stage = useRef<HTMLDivElement>(null);
  const commentsOpen = !!commentsOn;

  // the bubble stays open while you click through the prototype: it moves on to the screen you reach
  useEffect(() => {
    if (commentsOn && commentsOn !== screen.id) openComments(screen.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.id]);

  useEffect(() => select(screen.id), [screen.id, select]);
  useEffect(() => setChosen(recall(store)), [store]);

  const pick = (key: string) => {
    setChosen(key);
    remember(store, key);
  };

  // a screen wider than the stage is shown scaled down (CSS zoom keeps scrolling and hit-testing right); a phone keeps room for its bezel
  const room = width - CHROME + (devMode && inspectorOpen ? 300 - codeWidth : 0);
  const zoom = Math.max(0.4, Math.min(1, room / (vp.kind === 'page' ? vp.width : vp.width + 40)));

  return (
    <div className={`pd-screen-page${devMode ? ' is-dev' : ''}`}>
      <div className="pd-sizebar">
        {devMode && <DevPath file={screen.file} />}
        <div className="pd-sizebar__end">
          <CommentsToggle open={commentsOpen} onClick={() => openComments(commentsOpen ? null : screen.id)} screen={screen.id} />
          {sizes.length > 1 && (
            <div className="pd-sizes" role="group" aria-label={t.responsive}>
              {sizes.map((s) => (
                <button key={s.key} type="button" aria-pressed={s.key === size.key} title={`${s.vp.label} · ${s.vp.width}×${s.vp.height}`} onClick={() => pick(s.key)}>
                  <SizeIcon width={s.vp.width} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div ref={stage} className={`pd-stage pd-stage--${vp.kind}`}>
        <Frame key={vp.key} screen={screen} vp={vp} zoom={zoom} />
        {devMode && <Measure key={`${screen.id}/${vp.key}`} host={stage} on="prototype" />}
      </div>
      {devMode && <p className="pd-measure__hint">{t.measureHint}</p>}
    </div>
  );
};

/** Next to the screen in the prototype: the comments on it, with how many still wait to be made. */
const CommentsToggle = ({ open, onClick, screen }: { open: boolean; onClick: () => void; screen: string }) => {
  const t = useT();
  const waiting = useOpenCount(screen);

  return (
    <button type="button" className="pd-commentstoggle" aria-pressed={open} onClick={onClick} data-comments-opener>
      <Icon name="message-circle" size={15} />
      {t.comments}
      {waiting > 0 && <span className="pd-count">{waiting}</span>}
    </button>
  );
};

/** Dev mode: where the screen lives, above it, also when the side panel is closed. */
const DevPath = ({ file }: { file: string }) => {
  const dev = useDevEnv();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const full = pathOnComputer(dev, file);

  return (
    <div className="pd-devpath">
      <code title={full ?? file}>{file}</code>
      <button
        type="button"
        className="pd-iconbtn pd-iconbtn--sm"
        aria-label={t.copyPath}
        title={t.copyPath}
        onClick={() =>
          void navigator.clipboard?.writeText(full ?? file).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          })
        }
      >
        <Icon name={copied ? 'check' : 'copy'} size={14} />
      </button>
      {full && (
        <a className="pd-devpath__link" href={vscodeLink(full)}>
          {t.openVsCode}
        </a>
      )}
    </div>
  );
};
