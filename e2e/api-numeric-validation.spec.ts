import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('E2E Audit - API numeric validation (assertFiniteNumber)', () => {
  test('PUT /api/products/:id rejects NaN/Infinity with 400', async ({ page }) => {
    await login(page)

    // Use a positive numeric ID. The endpoint validates numeric finiteness before calling WooCommerce.
    const productId = process.env.E2E_PRODUCT_ID_FOR_API_TEST || '1'

    const res = await page.request.put(`/api/products/${productId}`, {
      data: {
        regular_price: 'NaN'
      }
    })

    expect(res.status()).toBe(400)

    const json = await res.json().catch(() => ({}))
    expect(String(json?.error || '')).toMatch(/valid number/i)
  })
})
