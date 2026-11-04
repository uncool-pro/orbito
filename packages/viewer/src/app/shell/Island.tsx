import { STATUSES } from '@uncool-pro/orbito-core';
import type { Page, Status } from '@uncool-pro/orbito-core';

import { useT } from '../../i18n';
import { canvasHash, screenHash } from '../routes';
import type { Mode } from '../routes';
import { useShell, useZoom } from './state';
import { Icon } from '../icons';

/** View options of the canvas (filter, versions, other links, wheel), in a small menu on the island. */
const ViewMenu = ({ mode }: { mode: Mode }) => {
  const t = useT();

  return (
    <details className="pd-viewmenu">
      <summary>{t.view}</summary>
      <div className="pd-viewmenu__pop">
        <ViewOptionsPanel mode={mode} />
      </div>
    </details>
  );
};

const ViewOptionsPanel = ({ mode }: { mode: Mode }) => {
  const { options, setOptions } = useShell();
  const t = useT();

  return (
    <section className="pd-insp pd-insp--options">
      {mode === 'prototype' ? (
        <p className="pd-muted">{t.prototypeHint}</p>
      ) : (
        <>
          <label className="pd-field">
            <span>{t.status}</span>
            <select className="pd-select" value={options.statusFilter} onChange={(e) => setOptions({ statusFilter: e.target.value as Status | '' })}>
              <option value="">{t.any}</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t.statusLabels[st]}
                </option>
              ))}
            </select>
          </label>
          {mode === 'board' && (
            <label className="pd-toggle">
              <input type="checkbox" checked={options.showClosed} onChange={(e) => setOptions({ showClosed: e.target.checked })} /> {t.versions}
            </label>
          )}
          {mode === 'flows' && (
            <label className="pd-toggle">
              <input type="checkbox" checked={options.showOther} onChange={(e) => setOptions({ showOther: e.target.checked })} /> {t.showOther}
            </label>
          )}
          <label className="pd-toggle">
            <input type="checkbox" checked={options.wheelZooms} onChange={(e) => setOptions({ wheelZooms: e.target.checked })} /> {t.wheelZooms}
          </label>
        </>
      )}
    </section>
  );
};

export const Island = ({ mode, page, flowKey }: { mode: Mode; page?: Page; flowKey?: string }) => {
  const { canvas, selected } = useShell();
  const zoom = useZoom();
  const t = useT();
  const flow = page?.flows.find((f) => f.key === flowKey);
  const firstScreen = selected ?? flow?.screens[0] ?? page?.flows[0]?.screens[0];
  const canZoom = mode === 'board' || mode === 'flows';

  return (
    <div className="pd-island" data-pd-ui role="toolbar" aria-label={t.modes}>
      <div className="pd-island__modes">
        <a className={mode === 'board' ? 'is-on' : ''} href={canvasHash('board', page?.key, flow?.key)}>
          {t.board}
        </a>
        <a className={mode === 'flows' ? 'is-on' : ''} href={canvasHash('flows', page?.key, flow?.key)}>
          {t.flows}
        </a>
        <a className={mode === 'prototype' ? 'is-on' : ''} href={firstScreen ? screenHash(firstScreen) : '#/'}>
          {t.prototype}
        </a>
      </div>
      {canZoom && <ViewMenu mode={mode} />}
      {canZoom && (
        <div className="pd-island__zoom">
          <button type="button" onClick={() => canvas.current?.zoomBy(0.8)} aria-label={t.zoomOut}>
            <Icon name="minus" size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => canvas.current?.zoomBy(1.25)} aria-label={t.zoomIn}>
            <Icon name="plus" size={14} />
          </button>
          <button type="button" onClick={() => canvas.current?.fit()}>
            {t.fit}
          </button>
        </div>
      )}
    </div>
  );
};
