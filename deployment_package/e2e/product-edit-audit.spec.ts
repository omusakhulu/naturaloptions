import { test, expect } from '@playwright/test'
import { login } from './auth'

function getProductIdOrSkip() {
  const id = process.env.E2E_PRODUCT_ID
  if (!id) return null
  return id
}

test.describe('E2E Audit - Edit Product page', () => {
  test('Sticky header actions remain reachable after scroll', async ({ page }) => {
    const productId = getProductIdOrSkip()
    test.skip(!productId, 'Set E2E_PRODUCT_ID to run product edit audit')

    await login(page)

    await page.goto(`/en/apps/ecommerce/products/edit/${productId}`)
    await page.waitForLoadState('domcontentloaded')

    const discard = page.getByRole('button', { name: 'Discard' })
    const saveDraft = page.getByRole('button', { name: 'Save Draft' })
    const update = page.getByRole('button', { name: 'Update Product' })
    const publish = page.getByRole('button', { name: 'Publish Product' })

    await expect(discard).toBeVisible()
    await expect(saveDraft).toBeVisible()
    await expect(update).toBeVisible()
    await expect(publish).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Sticky header is position: sticky top: 0; verify buttons remain in viewport.
    for (const btn of [discard, saveDraft, update, publish]) {
      await expect(btn).toBeVisible()

      const box = await btn.boundingBox()
      expect(box, 'Expected button to have a bounding box').not.toBeNull()

      if (box) {
        expect(box.y, 'Expected sticky header button to remain near top of viewport').toBeLessThan(200)
      }
    }
  })

  test('Tabs switch without navigation and preserve entered data', async ({ page }) => {
    const productId = getProductIdOrSkip()
    test.skip(!productId, 'Set E2E_PRODUCT_ID to run product edit audit')

    await login(page)

    await page.goto(`/en/apps/ecommerce/products/edit/${productId}`)
    await page.waitForLoadState('domcontentloaded')

    const nameField = page.getByLabel('Product Name')

    // If label differs in your form, the test will surface it quickly.
    await expect(nameField).toBeVisible()

    const newName = `E2E Audit ${Date.now()}`
    await nameField.fill(newName)

    await page.getByRole('tab', { name: 'Pricing / Inventory' }).click()
    await expect(page).toHaveURL(new RegExp(`/en/apps/ecommerce/products/edit/${productId}`))

    await page.getByRole('tab', { name: 'General' }).click()
    await expect(nameField).toHaveValue(newName)
  })

  test('Sticky header Update Product triggers PUT /api/products/:id and shows success toast', async ({ page }) => {
    const productId = getProductIdOrSkip()
    test.skip(!productId, 'Set E2E_PRODUCT_ID to run product edit audit')

    await login(page)

    await page.goto(`/en/apps/ecommerce/products/edit/${productId}`)
    await page.waitForLoadState('domcontentloaded')

    const putReq = page.waitForRequest(req => req.method() === 'PUT' && req.url().includes(`/api/products/${productId}`))

    await page.getByRole('button', { name: 'Update Product' }).click()

    await putReq

    // react-toastify default role isn't always accessible; fall back to text.
    await expect(page.getByText('Product updated successfully!')).toBeVisible({ timeout: 30_000 })
  })

  test('Autocomplete (Upsells/Cross-sells) triggers search request after 2+ chars', async ({ page }) => {
    const productId = getProductIdOrSkip()
    test.skip(!productId, 'Set E2E_PRODUCT_ID to run product edit audit')

    await login(page)

    await page.goto(`/en/apps/ecommerce/products/edit/${productId}`)
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('tab', { name: 'Marketing' }).click()

    const reqPromise = page.waitForRequest(req => {
      return req.url().includes('/api/products/search?') && req.url().includes('query=ab')
    })

    const upsellsField = page.getByLabel('Upsells')
    await expect(upsellsField).toBeVisible()
    await upsellsField.fill('ab')

    await reqPromise
  })

  test('NaN validation blocks update (client-side) for numeric fields', async ({ page }) => {
    const productId = getProductIdOrSkip()
    test.skip(!productId, 'Set E2E_PRODUCT_ID to run product edit audit')

    await login(page)

    await page.goto(`/en/apps/ecommerce/products/edit/${productId}`)
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('tab', { name: 'Pricing / Inventory' }).click()

    const regularPrice = page.getByLabel('Regular Price')
    await expect(regularPrice).toBeVisible()

    await regularPrice.fill('abc')

    // Clicking update should not send PUT when the form is invalid.
    const putAttempt = page.waitForRequest(
      req => req.method() === 'PUT' && req.url().includes(`/api/products/${productId}`),
      { timeout: 2_000 }
    )

    await page.getByRole('button', { name: 'Update Product' }).click()

    await expect(regularPrice).toHaveAttribute('aria-invalid', 'true')

    await expect(putAttempt).rejects.toThrow()
  })
})
