import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('E2E Audit - Dashboard invoices actions', () => {
  test('View (eye) navigates to the correct invoice preview route', async ({ page }) => {
    await login(page)

    await page.goto('/en/apps/ecommerce/dashboard')
    await page.waitForLoadState('domcontentloaded')

    const firstRowInvoiceLink = page.locator('a[href*="/en/apps/invoice/preview/"]').first()
    await expect(firstRowInvoiceLink).toHaveAttribute('href', /\/en\/apps\/invoice\/preview\//)

    const href = (await firstRowInvoiceLink.getAttribute('href')) || ''
    const id = href.split('/').pop()

    await Promise.all([page.waitForURL(new RegExp(`/en/apps/invoice/preview/${id}`)), firstRowInvoiceLink.click()])
    await expect(page).toHaveURL(new RegExp(`/en/apps/invoice/preview/${id}`))
  })

  test('Delete (trash) calls DELETE /api/invoices/:id for that row (confirm dialog)', async ({ page }) => {
    await login(page)

    await page.goto('/en/apps/ecommerce/dashboard')
    await page.waitForLoadState('domcontentloaded')

    const previewLink = page.locator('a[href*="/en/apps/invoice/preview/"]').first()
    const href = (await previewLink.getAttribute('href')) || ''
    const id = href.split('/').pop() || ''

    page.once('dialog', dialog => dialog.accept())

    const deleteRequest = page.waitForRequest(req => {
      return req.method() === 'DELETE' && req.url().includes(`/api/invoices/${encodeURIComponent(id)}`)
    })

    const trashButton = page.locator('button:has(i.tabler-trash)').first()
    await trashButton.click()

    await deleteRequest
  })
})
