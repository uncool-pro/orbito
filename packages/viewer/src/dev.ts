import { useEffect, useState } from 'react';

/**
 * What the dev server tells the viewer about the machine: the project folder and the system (to name the file manager:
 * Explorer, Finder or the folder). Nothing in a build — there is no server to open files there.
 */
export type DevEnv = {
  root: string;
  platform: string;
  sep: string;
  /** Running in Docker: the root is the container's, the person's system is out of reach. */
  container?: boolean;
  /** In Docker: the project folder on the person's computer, as compose passed it (ORBITO_HOST_ROOT). */
  hostRoot?: string;
  /** The person's name from git, when git has one (not in a container). */
  name?: string;
};

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

/**
 * The path of a project file on the person's computer, wherever Orbito runs: the server's own path outside a container, the
 * folder compose passed in a container (its notation guessed from it: a drive letter or a backslash means Windows). `null`
 * when it is not known.
 */
export const pathOnComputer = (env: DevEnv | null, file: string): string | null => {
  if (!env) return null;
  if (!env.container) return absolutePath(env, file);
  if (!env.hostRoot) return null;
  // Git Bash on Windows passes its own notation (/c/Users/...): back to the drive letter Windows tools understand
  const root = env.hostRoot.replace(/^\/([A-Za-z])(?=\/)/, (_, drive: string) => `${drive.toUpperCase()}:`).replace(/[\\/]+$/, '');
  const sep = /^[A-Za-z]:|\\/.test(root) ? '\\' : '/';

  return [root.split(/[\\/]/).join(sep), ...file.split('/')].join(sep);
};

/** A link that opens the file in VS Code, from the browser itself: works in a container too, as the editor runs on the computer. */
export const vscodeLink = (path: string) => `vscode://file/${path.split('\\').join('/')}`;

/** Shows the file in the system's file manager, selected. */
export const revealFile = (file: string) => fetch(`/__orbito/reveal?path=${encodeURIComponent(file)}`, { method: 'POST' });

/** Opens the file in the code editor (Vite's own endpoint: it finds the running editor, or uses $EDITOR). */
export const openInEditor = (env: DevEnv, file: string) => fetch(`/__open-in-editor?file=${encodeURIComponent(absolutePath(env, file))}`);
