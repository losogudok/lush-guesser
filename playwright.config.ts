import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
    timezoneId: 'Europe/Moscow'
  },
  webServer: [
    {
      command: 'pnpm --dir server run start:dev',
      url: 'http://127.0.0.1:3101/api/leaderboard',
      reuseExistingServer: false,
      env: {
        DATABASE_PATH: ':memory:',
        NODE_ENV: 'test',
        PORT: '3101',
      },
    },
    {
      command: 'pnpm --dir frontend run dev --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: {
        VITE_API_PROXY_TARGET: 'http://127.0.0.1:3101',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      }
    },
  ],
});
