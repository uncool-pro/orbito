import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import type { Screen } from '@uncool-pro/orbito-core';

import { useT } from '../i18n';
import { useCopy } from './useCopy';
import { useViewer } from './context';
import { useShell } from './shell/state';

/**
 * Dev mode, in the right panel: the code of the screen, and of each design-system component it is built from, one at a
 * time. Read through the dev server (`/__orbito/source`, screens and components only). The panel's width is dragged at
 * its left edge and remembered on this computer.
 */
export const CodePanel = ({ screen }: { screen: Screen<ComponentType> }) => {
  const { ds } = useViewer();
  const { codeWidth, setCodeWidth } = useShell();
  const t = useT();
  const parts = ds.report.screens[screen.id] ?? [];
  const files = [
    { label: screen.file.split('/').pop()!, file: screen.file },
    ...parts.flatMap((name) =>
      ds.report.components.filter((c) => c.name === name).map((c) => ({ label: c.name, file: c.file })),
    ),
  ];
  const [file, setFile] = useState(screen.file);
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { copied, copy } = useCopy();
  const drag = useRef<{ x: number; w: number } | null>(null);

  useEffect(() => setFile(screen.file), [screen.file]);
  useEffect(() => {
    let live = true;

    setCode(null);
    setFailed(false);
    fetch(`/__orbito/source?path=${encodeURIComponent(file)}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(
        (text) => live && setCode(text),
        () => live && setFailed(true),
      );

    return () => {
      live = false;
    };
  }, [file]);

  return (
    <section className="pd-code">
      {/* biome-ignore lint/a11y/useSemanticElements: a drag handle, not a line between parts of the content */}
      <div
        className="pd-code__grip"
        role="separator"
        aria-orientation="vertical"
        aria-label={t.resizeCode}
        title={t.resizeCode}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, w: codeWidth };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setCodeWidth(Math.round(Math.min(900, Math.max(300, drag.current.w + drag.current.x - e.clientX))));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      />
      <div className="pd-code__head">
        <b>{t.code}</b>
        <button type="button" className="pd-btn pd-btn--sm" disabled={!code} onClick={() => copy('code', code ?? '')}>
          {copied ? `✓ ${t.copied}` : t.copyCode}
        </button>
      </div>
      <div className="pd-code__files" role="tablist">
        {files.map((f) => (
          <button
            key={f.file}
            type="button"
            role="tab"
            aria-selected={f.file === file}
            className={f.file === file ? 'is-on' : ''}
            onClick={() => setFile(f.file)}
            title={f.file}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="pd-code__note">{t.mockupCode}</p>
      {failed ? (
        <p className="pd-code__note">{t.codeUnavailable}</p>
      ) : (
        <pre className="pd-code__text">
          {(code ?? '').split('\n').map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a line of code is its number
            <span key={i}>
              <i>{i + 1}</i>
              {line}
              {'\n'}
            </span>
          ))}
        </pre>
      )}
    </section>
  );
};
