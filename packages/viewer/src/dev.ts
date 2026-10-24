import { useEffect, useState } from 'react';

/**
 * What the dev server tells the viewer about the machine: the project folder and the system (to name the file manager:
 * Explorer, Finder or the folder). Nothing in a build — there is no server to open files there.
 */
export type DevEnv = { root: string; platform: string; sep: string };

let env: Promise<DevEnv | null> | undefined;

const load = () =>
  (env ??= import.meta.env.DEV
    ? fetch('/__orbito/env')
        .then((r) => (r.ok ? (r.json() as Promise<DevEnv>) : null))
        .catch(() => null)
    : Promise.resolve(null));

export const useDevEnv = () => {
  const [value, setValue] = useState<DevEnv | null>(null);

  useEffect(() => {
    let live = true;

    void load().then((v) => live && setValue(v));

    return () => {
      live = false;
    };
  }, []);

  return value;
};

/** The absolute path of a project file, in the system's own notation (to paste into a terminal or a file dialog). */
export const absolutePath = (env: DevEnv, file: string) => [env.root, ...file.split('/')].join(env.sep);

/** Shows the file in the system's file manager, selected. */
export const revealFile = (file: string) => fetch(`/__orbito/reveal?path=${encodeURIComponent(file)}`, { method: 'POST' });

/** Opens the file in the code editor (Vite's own endpoint: it finds the running editor, or uses $EDITOR). */
export const openInEditor = (env: DevEnv, file: string) => fetch(`/__open-in-editor?file=${encodeURIComponent(absolutePath(env, file))}`);
