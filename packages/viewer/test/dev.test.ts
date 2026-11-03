import { describe, expect, it } from 'vitest';

import { pathOnComputer, vscodeLink } from '../src/dev';

const inContainer = (hostRoot?: string) => ({ root: '/project', platform: 'linux', sep: '/', container: true, hostRoot });

describe('the path of a file on the person’s computer', () => {
  it('uses the server’s own path outside a container', () => {
    expect(pathOnComputer({ root: 'C:\\work\\shop', platform: 'win32', sep: '\\' }, 'screens/a.screen.tsx')).toBe('C:\\work\\shop\\screens\\a.screen.tsx');
  });

  it('uses the folder compose passed in a container, in that system’s notation', () => {
    expect(pathOnComputer(inContainer('C:\\work\\shop'), 'screens/a.screen.tsx')).toBe('C:\\work\\shop\\screens\\a.screen.tsx');
    expect(pathOnComputer(inContainer('/c/work/shop'), 'screens/a.screen.tsx')).toBe('C:\\work\\shop\\screens\\a.screen.tsx');
    expect(pathOnComputer(inContainer('/Users/ola/shop/'), 'screens/a.screen.tsx')).toBe('/Users/ola/shop/screens/a.screen.tsx');
  });

  it('says nothing rather than guess', () => {
    expect(pathOnComputer(inContainer(), 'screens/a.screen.tsx')).toBeNull();
    expect(pathOnComputer(null, 'screens/a.screen.tsx')).toBeNull();
  });

  it('opens VS Code with forward slashes', () => {
    expect(vscodeLink('C:\\work\\shop\\a.tsx')).toBe('vscode://file/C:/work/shop/a.tsx');
  });
});
