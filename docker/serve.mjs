// The board inside the container: the project's folders are read from /project, the project's own vite.config is not run.
import react from '@vitejs/plugin-react';
import orbito from '@uncool-pro/orbito-vite-plugin';
import { createServer } from 'vite';

const root = process.env.ORBITO_PROJECT ?? '/project';
const port = Number(process.env.ORBITO_PORT ?? 5190);

// the page runs in the person's browser, outside the container: nothing in it may talk to other sites either
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  `connect-src 'self' ws://localhost:${port} ws://127.0.0.1:${port}`,
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

/** @type {import('vite').Plugin} */
const sealedPage = {
  name: 'orbito-sealed-page',
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Content-Security-Policy', CSP);
      next();
    });
  },
};

const server = await createServer({
  root,
  configFile: false,
  cacheDir: process.env.ORBITO_CACHE ?? '/tmp/orbito-vite',
  base: './',
  plugins: [react(), orbito(), sealedPage],
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    // changes made from outside the container do not always reach it as file events
    watch: { usePolling: true, interval: 400 },
  },
});

await server.listen();
console.log(`Orbito is ready: http://localhost:${port}`);
