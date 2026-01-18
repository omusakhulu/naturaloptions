import type { Page } from '@playwright/test'

export async function login(page: Page) {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  if (!email || !password) {
    throw new Error(
      [
        'Missing E2E_EMAIL or E2E_PASSWORD env vars.',
        'Set them in your shell or in .env (Playwright config loads dotenv).',
        'Seeded defaults (see prisma/seed.js):',
        '  E2E_EMAIL=admin@naturaloptions.com',
        '  E2E_PASSWORD=password123'
      ].join('\n')
    )
  }

  await page.goto('/en/pages/auth/login-v2')

  await page.getByLabel('Email or Username').fill(email)
  await page.getByLabel('Password').fill(password)

  await Promise.all([
    page.waitForURL(/\/en\/apps\/ecommerce\/dashboard/, { timeout: 60_000 }),
    page.getByRole('button', { name: 'Login' }).click()
  ])
}
