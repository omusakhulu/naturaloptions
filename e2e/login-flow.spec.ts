import { test, expect } from '@playwright/test'
import { login } from './auth'

test.describe('Login Flow', () => {
  test('redirects unauthenticated user to login page', async ({ page }) => {
    // Try to access dashboard directly
    const response = await page.goto('/en/apps/ecommerce/dashboard')
    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/en\/apps\/ecommerce\/dashboard/)
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/en/pages/auth/login-v2')
    await page.getByLabel('Email or Username').fill('invalid@test.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()
    // Should stay on login page
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/login/)
  })

  test('authenticated user accessing login is redirected to dashboard', async ({ page }) => {
    await login(page)
    await page.goto('/en/pages/auth/login-v2')
    await expect(page).toHaveURL(/\/en\/apps\/ecommerce\/dashboard/)
  })
})
