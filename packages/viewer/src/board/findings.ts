import { useEffect, useState } from 'react';

import type { Flow } from '@uncool-pro/orbito-core';

/**
 * Finding titles of a version's report: the first table whose first column is a number is read as
 * `| # | ... | title | ...` (the column named "finding", "problem" or "title", else the last one).
 */
export const parseFindings = (md: string): Record<number, string> => {
  const out: Record<number, string> = {};
  let titleCol = -1;

  md.split(/\r?\n/).forEach((line) => {
    if (!line.trim().startsWith('|')) return;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim().replace(/\*\*|`/g, ''));

    if (titleCol < 0 && !/^\d+$/.test(cells[0] ?? '')) {
      const i = cells.findIndex((c) => /^(finding|problem|title|uwaga|problem)$/i.test(c));

      if (i > 0) titleCol = i;

      return;
    }
    const n = Number(cells[0]);

    if (!Number.isInteger(n)) return;
    const text = cells[titleCol > 0 ? titleCol : cells.length - 1] ?? '';

    out[n] = text.length > 140 ? `${text.slice(0, 139)}…` : text;
  });

  return out;
};

/** Finding titles by version lane key (`<flow>/<version>`), loaded from the reports in dev. */
export const useFindingTitles = (flows: Flow[]) => {
  const [titles, setTitles] = useState<Record<string, Record<number, string>>>({});

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let live = true;

    flows.forEach((f) =>
      (f.versions ?? []).forEach((v) => {
        if (!v.report) return;
        fetch(`/__orbito/file?path=${encodeURIComponent(v.report)}`)
          .then((r) => (r.ok ? r.text() : ''))
          .then((md) => live && setTitles((t) => ({ ...t, [`${f.key}/${v.key}`]: parseFindings(md) })))
          .catch(() => undefined);
      }),
    );

    return () => {
      live = false;
    };
  }, [flows]);

  return titles;
};
