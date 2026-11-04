import { defineConfig } from '@playwright/test';

// Real clicks in a real browser. Uses the Chrome already on the computer, so nothing extra is downloaded.
// another port when 5191 is taken (a board left open in another window): ORBITO_E2E_PORT=5193 npx playwright test
const PORT = Number(process.env.ORBITO_E2E_PORT ?? 5191);

// the welcome shows once per computer: the tests start after it, on the board's port and on the container's (5190)
const welcomed = (...ports: number[]) => ({
  cookies: [],
  origins: [...new Set([...ports, 5190])].map((p) => ({ origin: `http://localhost:${p}`, localStorage: [{ name: 'pd.welcomed', value: '1' }] })),
});

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'node_modules/.cache/orbito-e2e',
  workers: 1,
  // on GitHub each failure also shows in the pull request, readable without the full log
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  // every test starts as someone who has seen the welcome already; the welcome has a test of its own
  use: { baseURL: `http://localhost:${PORT}`, channel: 'chrome', viewport: { width: 1440, height: 900 }, storageState: welcomed(PORT) },
  webServer: { command: `npm run dev -w demo -- --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: false },
});
