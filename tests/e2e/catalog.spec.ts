import { test, expect } from '@playwright/test'

test('catalog shows products and filters by category', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Tienda Mundial 2026/i })).toBeVisible()
  const firstCard = page.locator('a[href^="/productos/"]').first()
  await expect(firstCard).toBeVisible()
  await page.getByRole('link', { name: 'Balones' }).click()
  await expect(page).toHaveURL(/category=balon/)
})

test('product detail page renders', async ({ page }) => {
  await page.goto('/')
  await page.locator('a[href^="/productos/"]').first().click()
  await expect(page).toHaveURL(/\/productos\//)
  await expect(page.getByRole('link', { name: /Volver al catálogo/i })).toBeVisible()
})
