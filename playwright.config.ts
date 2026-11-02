import { defineConfig } from '@playwright/test';

// Real clicks in a real browser. Uses the Chrome already on the computer, so nothing extra is downloaded.
const PORT = 5191;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'node_modules/.cache/orbito-e2e',
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, channel: 'chrome', viewport: { width: 1440, height: 900 } },
  webServer: { command: `npm run dev -w demo -- --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: false },
});
