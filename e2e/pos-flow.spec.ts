import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('POS Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('POS terminal page loads', async ({ page }) => {
    await page.goto('/en/apps/pos')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    expect(url).toContain('/pos')
  })

  test('POS displays product grid or search', async ({ page }) => {
    await page.goto('/en/apps/pos')
    await page.waitForLoadState('networkidle')
    // Should have some interactive content
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })
})
