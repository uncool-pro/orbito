/**
 * Small file helpers shared by the CLI and the dev server. Node built-ins only: `create` uses the CLI's files before
 * anything is installed in the project.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

/** True when `file` is inside `dir`, by its path alone (works with Windows separators and drive letters). */
export const inside = (dir: string, file: string): boolean => {
  const rel = relative(dir, file);

  return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
};

/**
 * True when `file` exists and is inside `dir` once every link on the way is followed: a link inside the project that
 * points elsewhere is not a project file. Use it before reading a path that came from outside (the browser, a mockup).
 */
export const insideForReal = (dir: string, file: string): boolean => {
  if (!inside(dir, file) || !existsSync(file)) return false;
  try {
    return inside(realpathSync(dir), realpathSync(file));
  } catch {
    return false;
  }
};

/** The JSON in a file, or `fallback` when the file is missing or cannot be read as JSON. */
export const readJson = <T>(file: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
};
