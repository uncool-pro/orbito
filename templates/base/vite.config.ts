import react from '@vitejs/plugin-react';
import orbito from '@uncool-pro/orbito-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), orbito()],
  base: './',
  server: { port: 5190 },
});
