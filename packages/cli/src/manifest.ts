/**
 * The list of what Orbito installed in a project, with a fingerprint of each item, so an update can tell Orbito's items
 * from the person's own. Node built-ins only: `create` writes the first list before anything is installed in the project.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const MANIFEST = '.orbito/managed.json';
export const PROFILES = '.orbito/models.json';
export const LOCAL_SETTINGS = '.orbito/settings.local.json';
export type Manifest = { version: string; items: Record<string, string> };

/** Fingerprint of a file or a folder (names and contents, in a stable order). */
export const fingerprint = (path: string): string => {
  const h = createHash('sha1');
  const walk = (p: string, rel: string) => {
    if (statSync(p).isDirectory()) {
      for (const n of readdirSync(p).sort()) walk(join(p, n), `${rel}/${n}`);
    } else {
      h.update(rel);
      h.update(readFileSync(p));
    }
  };

  walk(path, '');

  return h.digest('hex').slice(0, 16);
};
