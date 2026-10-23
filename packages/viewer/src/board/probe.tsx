import type { ComponentType } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import type { Hotspot, LinkMap, Project } from '@uncool-pro/orbito-core';
import { FrameContext } from '@uncool-pro/orbito-runtime';

const labelOf = (el: Element) =>
  (el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);

/**
 * Renders every screen once, offscreen and at its real size, and records each link element with its position.
 * That is how the board knows the arrows (nothing is declared twice) and where on the screen each one starts.
 */
export const probeLinks = async (project: Project<ComponentType>): Promise<LinkMap> => {
  const host = document.createElement('div');

  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;contain:layout style';
  document.body.appendChild(host);
  const out: LinkMap = {};

  try {
    for (const s of project.screens) {
      // a fresh task per screen: never flush a root while React is rendering, and keep the page responsive on big projects
      await new Promise((r) => setTimeout(r, 0));
      const vp = project.viewports[s.viewport ?? project.config.defaultViewport]!;
      const box = document.createElement('div');

      box.style.cssText = `position:relative;width:${vp.width}px;height:${vp.height}px;overflow:hidden`;
      host.appendChild(box);
      const root = createRoot(box);
      const Screen = s.component;

      try {
        flushSync(() =>
          root.render(
            <FrameContext.Provider value={{ mode: 'probe', viewport: vp }}>
              <Screen />
            </FrameContext.Provider>,
          ),
        );
        const origin = box.getBoundingClientRect();
        const spots: Hotspot[] = [];

        box.querySelectorAll('[data-pd-to], [data-pd-back]').forEach((el) => {
          const r = el.getBoundingClientRect();
          // a <Transition> (error, timeout) has no box: anchor it to the middle of the screen
          const hidden = r.width === 0 && r.height === 0;
          const y = hidden ? vp.height / 2 : r.top - origin.top;

          spots.push({
            to: el.hasAttribute('data-pd-back') ? null : el.getAttribute('data-pd-to'),
            label: labelOf(el),
            trigger: el.getAttribute('data-pd-trigger') ?? 'tap',
            x: hidden ? vp.width / 2 : r.left - origin.left,
            y,
            w: r.width,
            h: r.height,
            belowFold: !hidden && y + r.height / 2 > vp.height,
          });
        });
        out[s.id] = spots;
      } catch (err) {
        console.error(`[orbito] screen "${s.id}" failed to render in the link probe`, err);
        out[s.id] = [];
      } finally {
        root.unmount();
        box.remove();
      }
    }
  } finally {
    host.remove();
  }

  return out;
};
