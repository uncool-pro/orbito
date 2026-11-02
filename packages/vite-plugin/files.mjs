// Small file helpers shared by the plugin's parts.
import { readFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

/** True when `file` is inside `dir` (works with Windows separators and drive letters). */
export const inside = (dir, file) => {
  const rel = relative(dir, file);

  return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
};

export const readJson = (file, fallback) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};
