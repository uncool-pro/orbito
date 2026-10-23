import { useEffect, useRef, useState } from 'react';

import { STATUSES } from '@uncool-pro/orbito-core';
import type { Status, StatusEntry } from '@uncool-pro/orbito-core';

import { useT } from '../i18n';
import { canEditStatuses, setStatus } from '../status';

/** Status chip; in dev a click opens a small menu (status + note) that writes `.orbito/status.json`. */
export const StatusChip = ({ id, entry }: { id: string; entry: StatusEntry }) => {
  const t = useT();
  const [open, setOpen] = useState<DOMRect | null>(null);
  const editable = canEditStatuses();

  return (
    <>
      <button
        type="button"
        data-pd-ui
        className={`pd-status pd-status--${entry.status}`}
        title={entry.note ? `${t.statusLabels[entry.status]} — ${entry.note}` : t.statusLabels[entry.status]}
        disabled={!editable}
        onClick={(e) => setOpen(e.currentTarget.getBoundingClientRect())}
      >
        <i />
        {t.statusLabels[entry.status]}
        {entry.note ? ' •' : ''}
      </button>
      {open && <StatusMenu id={id} entry={entry} anchor={open} onClose={() => setOpen(null)} />}
    </>
  );
};

const StatusMenu = ({ id, entry, anchor, onClose }: { id: string; entry: StatusEntry; anchor: DOMRect; onClose: () => void }) => {
  const t = useT();
  const [status, setSt] = useState<Status>(entry.status);
  const [note, setNote] = useState(entry.note ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();

    window.addEventListener('pointerdown', away, true);
    window.addEventListener('keydown', esc);

    return () => {
      window.removeEventListener('pointerdown', away, true);
      window.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  return (
    <div ref={ref} data-pd-ui className="pd-menu" style={{ left: Math.min(anchor.left, window.innerWidth - 260), top: Math.min(anchor.bottom + 6, window.innerHeight - 330) }}>
      {STATUSES.map((s) => (
        <label key={s} className="pd-menu__row">
          <input type="radio" name="pd-status" checked={status === s} onChange={() => setSt(s)} />
          <span className={`pd-dot pd-status--${s}`} />
          {t.statusLabels[s]}
        </label>
      ))}
      <input className="pd-input" placeholder={t.note} value={note} onChange={(e) => setNote(e.target.value)} />
      <button
        type="button"
        className="pd-btn pd-btn--primary"
        onClick={() => {
          void setStatus(id, status, note.trim() || undefined);
          onClose();
        }}
      >
        {t.save}
      </button>
    </div>
  );
};
