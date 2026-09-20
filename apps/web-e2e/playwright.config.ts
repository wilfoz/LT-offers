import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração da suíte E2E do Playwright para o portal Web de Orçamentação EPC.
 */
export default defineConfig({
  testDir: './src/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    [
      'html',
      {
        outputFolder: '../../dist/.playwright/apps/web-e2e/playwright-report',
        open: 'never',
      },
    ],
    ['list'],
  ],
  outputDir: '../../dist/.playwright/apps/web-e2e/test-results',
  use: {
    baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npx nx serve web',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
