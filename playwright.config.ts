import { defineConfig } from '@playwright/test';

// Real clicks in a real browser. Uses the Chrome already on the computer, so nothing extra is downloaded.
const PORT = 5191;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'node_modules/.cache/orbito-e2e',
  workers: 1,
  // on GitHub each failure also shows in the pull request, readable without the full log
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  // every test starts as someone who has seen the welcome already; the welcome has a test of its own
  use: { baseURL: `http://localhost:${PORT}`, channel: 'chrome', viewport: { width: 1440, height: 900 }, storageState: 'e2e/welcomed.json' },
  webServer: { command: `npm run dev -w demo -- --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: false },
});
