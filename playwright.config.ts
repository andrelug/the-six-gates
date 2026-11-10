import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 480_000, // a whole playthrough per test: about a minute here, several on a CI runner
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run build && PORT=3100 npx next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 240_000,
    env: { ANTHROPIC_API_KEY: '' },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone', use: { viewport: { width: 400, height: 800 } } },
  ],
});
