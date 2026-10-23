/// <reference types="vite/client" />

declare module 'virtual:orbito/project' {
  import type { LoadedProject } from '@uncool-pro/orbito-viewer';

  const loaded: LoadedProject;
  export default loaded;
}
