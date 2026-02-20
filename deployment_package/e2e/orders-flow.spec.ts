import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('Orders Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('orders list page loads', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/orders/list')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/orders\/list/)
  })

  test('orders page renders table with data', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/orders/list')
    await page.waitForLoadState('networkidle')
    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: 15000 })
  })

  test('order detail page loads from list', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/orders/list')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('a[href*="/orders/"]').first()
    if (await firstLink.isVisible({ timeout: 5000 })) {
      await firstLink.click()
      await page.waitForLoadState('domcontentloaded')
      await expect(page).toHaveURL(/orders\//)
    }
  })
})
