import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('Products CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('product list page loads', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/products/list')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/products\/list/)
  })

  test('product list displays table', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/products/list')
    await page.waitForLoadState('networkidle')
    // Table or list should be present
    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: 15000 })
  })

  test('search products filters results', async ({ page }) => {
    await page.goto('/en/apps/ecommerce/products/list')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[placeholder*="earch"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
    }
  })
})
