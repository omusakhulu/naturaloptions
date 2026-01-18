import { test, expect } from '@playwright/test'
import { login } from './auth'

const SIDEBAR_LINK_HREFS = [
  '/en/apps/ecommerce/dashboard',
  '/en/apps/ecommerce/products/list',
  '/en/apps/ecommerce/products/add',
  '/en/apps/ecommerce/products/update-price',
  '/en/apps/ecommerce/products/import-products',
  '/en/apps/ecommerce/products/import-opening-stock',
  '/en/apps/ecommerce/products/categories',
  '/en/apps/ecommerce/products/brands',
  '/en/apps/ecommerce/products/warranties',
  '/en/apps/stock-adjustment',
  '/en/apps/ecommerce/orders/list',
  '/en/apps/user/list',
  '/en/apps/roles',
  '/en/apps/permissions',
  '/en/apps/ecommerce/customers/list',
  '/en/apps/accounting/vendors',
  '/en/apps/purchases/requisition',
  '/en/apps/purchases/order',
  '/en/apps/purchases/list',
  '/en/apps/purchases/add',
  '/en/apps/purchases/returns',
  '/en/apps/bi/dashboard',
  '/en/apps/bi/insights',
  '/en/apps/bi/analytics',
  '/en/apps/sell/sales-order',
  '/en/apps/sell/sales',
  '/en/apps/sell/pos/list',
  '/en/apps/sell/pos',
  '/en/apps/sell/quotations/add',
  '/en/apps/sell/quotations',
  '/en/apps/sell/returns',
  '/en/apps/sell/shipments',
  '/en/apps/sell/discounts',
  '/en/apps/expenses',
  '/en/apps/payment-accounts',
  '/en/apps/payment-accounts/balance-sheet',
  '/en/apps/payment-accounts/trial-balance',
  '/en/apps/payment-accounts/cash-flow',
  '/en/apps/accounting/dashboard',
  '/en/apps/accounting/chart-of-accounts',
  '/en/apps/accounting/journal-entries',
  '/en/apps/accounting/transactions',
  '/en/apps/accounting/reports',
  '/en/apps/accounting/financial-reports',
  '/en/apps/reports/profit-loss',
  '/en/apps/reports/purchase-sale',
  '/en/apps/reports/tax',
  '/en/apps/reports/supplier-customer',
  '/en/apps/reports/customer-groups',
  '/en/apps/reports/stock',
  '/en/apps/reports/stock-expiry',
  '/en/apps/reports/lot',
  '/en/apps/reports/stock-adjustment',
  '/en/apps/reports/trending-products',
  '/en/apps/reports/items',
  '/en/apps/reports/product-purchase',
  '/en/apps/reports/product-sell',
  '/en/apps/reports/purchase-payment',
  '/en/apps/reports/sell-payment',
  '/en/apps/reports/expense',
  '/en/apps/reports/register',
  '/en/apps/reports/sales-representative',
  '/en/apps/reports/activity-log',
  '/en/pages/account-settings'
]

const DISALLOWED_PATH_SNIPPETS = ['/404', '/en/pages/auth/login-v2', '/en/login']

function isSafeHref(href: string) {
  // Exclude external links; those should be audited differently.
  return href.startsWith('/en/')
}

test.describe('E2E Audit - Sidebar navigation', () => {
  test('All defined sidebar routes resolve (no 404/login redirect)', async ({ page }) => {
    await login(page)

    for (const href of SIDEBAR_LINK_HREFS.filter(isSafeHref)) {
      const res = await page.goto(href)
      expect(res, `No response navigating to ${href}`).not.toBeNull()

      const status = res?.status() ?? 0
      expect(status, `Non-OK response navigating to ${href}`).toBeLessThan(400)

      await page.waitForLoadState('domcontentloaded')

      const url = page.url()

      for (const bad of DISALLOWED_PATH_SNIPPETS) {
        expect(url, `Unexpected redirect while visiting ${href}: landed on ${url}`).not.toContain(bad)
      }
    }
  })
})
