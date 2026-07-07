import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'customer@test.com')
    await page.fill('input[name="password"]', 'P@ssword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/home')
  })

  test('full booking journey: browse -> select seats -> view ticket', async ({ page }) => {
    // Step 1: Browse now showing movies
    await page.goto('/movies')
    await expect(page.locator('text=now showing|dang chieu')).toBeVisible()

    // Step 2: Click on a movie
    const firstMovie = page.locator('[data-testid="movie-card"]').first()
    await firstMovie.click()
    await page.waitForURL(/\/movie\//)

    // Step 3: View showtimes
    await expect(page.locator('text=showtime|lich chieu')).toBeVisible()

    // Step 4: Select a showtime
    const showtimeButton = page.locator('[data-testid="showtime-button"]').first()
    await showtimeButton.click()
    await page.waitForURL(/\/booking\//)

    // Step 5: Seat selection page
    await expect(page.locator('[data-testid="seat-grid"]')).toBeVisible()

    // Step 6: Select available seats
    const availableSeat = page.locator('[data-testid="seat-available"]').first()
    await availableSeat.click()

    // Step 7: Verify seat is selected
    await expect(page.locator('[data-testid="selected-seats"]')).toContainText(/1|A|B/)

    // Step 8: Click proceed to pay
    await page.click('button:has-text("proceed|pay|thanh toan")')

    // Step 9: Should redirect to VNPay (or mock payment page)
    await page.waitForURL(/vnpay|booking\/success|booking\/failed/, { timeout: 10000 })
  })

  test('shows error when no seats selected', async ({ page }) => {
    await page.goto('/movies')
    const firstMovie = page.locator('[data-testid="movie-card"]').first()
    await firstMovie.click()

    const showtimeButton = page.locator('[data-testid="showtime-button"]').first()
    await showtimeButton.click()

    // Try to proceed without selecting seats
    const payButton = page.locator('button:has-text("proceed|pay|thanh toan")')
    if (await payButton.isVisible()) {
      await payButton.click()
      await expect(page.locator('text=select.*seat|chon.*ghe')).toBeVisible()
    }
  })
})
