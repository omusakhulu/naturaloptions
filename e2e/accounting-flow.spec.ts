import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('Accounting Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('chart of accounts page loads', async ({ page }) => {
    await page.goto('/en/apps/accounting/chart-of-accounts')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/chart-of-accounts/)
  })

  test('journal entries page loads', async ({ page }) => {
    await page.goto('/en/apps/accounting/journal-entries')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/journal-entries/)
  })

  test('balance sheet page loads', async ({ page }) => {
    await page.goto('/en/apps/accounting/reports/balance-sheet')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    expect(url).toContain('/accounting/')
  })
})
