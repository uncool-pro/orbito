import { memo } from 'react';
import type { ComponentType } from 'react';

import type { Card, Screen, Viewport } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

import { ErrorBoundary } from '../app/ErrorBoundary';
import { useT } from '../i18n';

/**
 * The live screen inside a card. It is `inert`: the board never lets a screen react to the pointer (no hover states,
 * no focus, no navigation), so a click on a card is always a click on the board. Memoised: panning never re-renders it.
 */
export const LiveScreen = memo(({ screen, viewport, card }: { screen: Screen<ComponentType>; viewport: Viewport; card: Pick<Card, 'frame'> }) => {
  const S = screen.component;

  return (
    <div className="pd-card__viewport" style={{ width: card.frame.w, height: card.frame.h }}>
      <div
        className="pd-card__inner"
        inert
        data-pd-page-scroll={viewport.kind === 'page' ? '' : undefined}
        style={{ width: viewport.width, height: viewport.height, transform: `scale(${card.frame.scale})`, overflowY: viewport.kind === 'page' ? 'auto' : 'hidden' }}
      >
        <FrameContext.Provider value={{ mode: 'board', viewport }}>
          <ErrorBoundary name={screen.code ?? screen.id}>
            <S />
          </ErrorBoundary>
        </FrameContext.Provider>
      </div>
    </div>
  );
});

type Props = {
  card: Card;
  screen: Screen<ComponentType>;
  viewport: Viewport;
  live: boolean;
  state: 'idle' | 'hl' | 'dim';
  active: boolean;
  findingTitles?: Record<number, string>;
};

export const BoardCard = memo(({ card, screen, viewport, live, state, active, findingTitles }: Props) => {
  const t = useT();

  return (
    <div
      className={`pd-card pd-card--${state}${active ? ' pd-card--active' : ''}${card.version ? ' pd-card--version' : ''}`}
      data-card={card.key}
      data-screen={card.screenId}
      style={{ left: card.x, top: card.y, width: card.w, height: card.h }}
    >
      {/* a light caption above the screen, as in design tools: the code (and a version's findings) small on top, the
          functional name right over the screen, up to two lines */}
      <div className="pd-card__head" title={screen.title}>
        {(screen.code || card.version) && (
          <div className="pd-card__meta">
            {screen.code && <span className="pd-card__code">{screen.code}</span>}
            {card.version && !card.version.replaces && <i className="pd-badge pd-badge--new">{t.newScreen}</i>}
            {card.version?.findings.map((n) => (
              <i key={n} className="pd-badge" title={findingTitles?.[n]}>
                #{n}
              </i>
            ))}
          </div>
        )}
        <span className="pd-card__name">{screen.title.split(' / ').pop()}</span>
      </div>
      <div className="pd-card__frame" style={{ left: card.frame.x - card.x, top: card.frame.y - card.y }}>
        {live ? <LiveScreen screen={screen} viewport={viewport} card={card} /> : <div className="pd-card__placeholder" style={{ width: card.frame.w, height: card.frame.h }} />}
      </div>
    </div>
  );
});
