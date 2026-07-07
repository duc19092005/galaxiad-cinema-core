import { test, expect } from '@playwright/test'

test.describe('Admin CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'P@ssword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('admin can create a new movie', async ({ page }) => {
    await page.goto('/admin/movies')

    // Click add movie button
    await page.click('button:has-text("add|them|create")')

    // Fill movie form
    await page.fill('input[name="title"]', 'E2E Test Movie')
    await page.fill('textarea[name="description"]', 'A movie created by E2E test')
    await page.fill('input[name="duration"]', '120')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=success|thanh cong|created')).toBeVisible()
  })

  test('admin can edit a movie', async ({ page }) => {
    await page.goto('/admin/movies')

    // Click edit on first movie
    const editButton = page.locator('[data-testid="edit-movie"]').first()
    await editButton.click()

    // Update title
    await page.fill('input[name="title"]', 'Updated Movie Title')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=success|updated|cap nhat')).toBeVisible()
  })

  test('admin can delete a movie', async ({ page }) => {
    await page.goto('/admin/movies')

    // Click delete on first movie
    const deleteButton = page.locator('[data-testid="delete-movie"]').first()
    await deleteButton.click()

    // Confirm deletion
    await page.click('button:has-text("confirm|delete|xoa|dong y")')

    // Verify success
    await expect(page.locator('text=deleted|xoa thanh cong|success')).toBeVisible()
  })

  test('admin can manage users', async ({ page }) => {
    await page.goto('/admin/users')

    // Should see user list
    await expect(page.locator('text=users|nguoi dung')).toBeVisible()

    // Should have search functionality
    const searchInput = page.locator('input[placeholder*="search|tim"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
    }
  })
})
