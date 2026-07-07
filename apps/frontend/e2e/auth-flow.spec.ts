import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('registration and login flow', async ({ page }) => {
    // Step 1: Go to register page
    await page.goto('/register')
    await expect(page.locator('text=register|dang ky')).toBeVisible()

    // Step 2: Fill registration form
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'P@ssword123!')
    await page.fill('input[name="confirmPassword"]', 'P@ssword123!')

    // Step 3: Submit registration
    await page.click('button[type="submit"]')

    // Step 4: Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 })

    // Step 5: Login with new account
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'P@ssword123!')
    await page.click('button[type="submit"]')

    // Step 6: Should redirect to home or role selection
    await page.waitForURL(/\/home|\/role-selection/, { timeout: 5000 })
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@test.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=invalid|failed|error|sai')).toBeVisible()
  })

  test('password mismatch shows error on register', async ({ page }) => {
    await page.goto('/register')

    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'P@ssword123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentP@ss!')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=not match|khong trung|khong khop')).toBeVisible()
  })

  test('unauthenticated user redirects to login', async ({ page }) => {
    await page.goto('/account')

    await page.waitForURL(/\/login/, { timeout: 5000 })
  })
})
