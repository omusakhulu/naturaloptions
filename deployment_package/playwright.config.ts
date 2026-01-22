import 'dotenv/config'

import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: process.env.E2E_STORAGE_STATE || undefined
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 393, height: 851 }
      }
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'] }
    }
  ]
})
