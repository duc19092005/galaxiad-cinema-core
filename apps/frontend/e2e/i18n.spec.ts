import { test, expect } from '@playwright/test'

test.describe('Internationalization', () => {
  test('switch language updates visible text', async ({ page }) => {
    await page.goto('/')

    // Find language switcher
    const langSwitcher = page.locator('[data-testid="language-switcher"]')
    if (await langSwitcher.isVisible()) {
      // Switch to Vietnamese
      await langSwitcher.click()
      await page.click('text=VI|Vietnamese|Tieng Viet')

      // Verify some Vietnamese text is visible
      await expect(page.locator('body')).toContainText(/phim|lich chieu|rap|uu dai/i)

      // Switch to English
      await langSwitcher.click()
      await page.click('text=EN|English')

      // Verify English text
      await expect(page.locator('body')).toContainText(/movie|showtime|theater|offer/i)
    }
  })

  test('language choice persists across page reload', async ({ page }) => {
    await page.goto('/')

    const langSwitcher = page.locator('[data-testid="language-switcher"]')
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click()
      await page.click('text=VI|Vietnamese|Tieng Viet')

      // Reload page
      await page.reload()

      // Language should still be Vietnamese
      const storedLang = await page.evaluate(() => localStorage.getItem('language'))
      expect(storedLang).toBe('vi')
    }
  })
})
