import { test, expect } from '@playwright/test'
import { login } from './auth'

const ROUTES = [
  '/',
  '/en',
  '/en/apps/ecommerce/dashboard',
  '/en/apps/ecommerce/products/list',
  '/en/apps/ecommerce/orders/list',
  '/en/apps/invoice/list'
]

test.describe('E2E Audit - Deep link validation', () => {
  for (const route of ROUTES) {
    test(`Deep-link loads without 404/hang: ${route}`, async ({ page }) => {
      await login(page)

      const res = await page.goto(route)
      expect(res, `No response for ${route}`).not.toBeNull()
      expect(res?.status() ?? 0, `HTTP error for ${route}`).toBeLessThan(400)

      await page.waitForLoadState('domcontentloaded')

      // Basic hang guard
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
        // If network never goes idle, still allow but flag if a loader is visible.
      })

      const bodyText = await page.locator('body').innerText().catch(() => '')
      expect(bodyText.trim().length, `Blank page for ${route}`).toBeGreaterThan(0)

      // If redirected to login, fail
      expect(page.url(), `Redirected to login from ${route}`).not.toContain('/en/pages/auth/login-v2')
      expect(page.url(), `Redirected to /404 from ${route}`).not.toContain('/404')
    })
  }

  test('Deep-link product edit loads (if E2E_PRODUCT_ID set)', async ({ page }) => {
    const productId = process.env.E2E_PRODUCT_ID
    test.skip(!productId, 'Set E2E_PRODUCT_ID to test product edit deep-link')

    await login(page)

    const route = `/en/apps/ecommerce/products/edit/${productId}`
    const res = await page.goto(route)
    expect(res, `No response for ${route}`).not.toBeNull()
    expect(res?.status() ?? 0, `HTTP error for ${route}`).toBeLessThan(400)

    await page.waitForLoadState('domcontentloaded')

    // If it hangs in the spinner state, this should time out.
    await expect(page.getByText('Loading product data...')).toHaveCount(0, { timeout: 20_000 })

    await expect(page.getByLabel('Product Name')).toBeVisible({ timeout: 20_000 })
  })
})
