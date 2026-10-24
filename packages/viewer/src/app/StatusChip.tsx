import { STATUSES } from '@uncool-pro/orbito-core';
import type { Status, StatusEntry } from '@uncool-pro/orbito-core';

import { useT } from '../i18n';
import { canEditStatuses, setStatus } from '../status';

/**
 * The status of a feature as a native dropdown, right where it is shown: it opens in place on every surface (also on
 * the zoomed board), works with the keyboard, and writes `.orbito/status.json` in dev. Read-only in a build.
 */
export const StatusChip = ({ id, entry }: { id: string; entry: StatusEntry }) => {
  const t = useT();
  const editable = canEditStatuses();

  return (
    <label className={`pd-status pd-status--${entry.status}`} data-pd-ui title={entry.note ? `${t.statusLabels[entry.status]} — ${entry.note}` : t.statusLabels[entry.status]}>
      <i />
      <select
        aria-label={t.status}
        value={entry.status}
        disabled={!editable}
        onChange={(e) => void setStatus(id, e.target.value as Status, entry.note)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t.statusLabels[s]}
          </option>
        ))}
      </select>
    </label>
  );
};
