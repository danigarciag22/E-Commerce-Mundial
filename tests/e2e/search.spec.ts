import { test, expect } from '@playwright/test'

test('header search returns matching products', async ({ page }) => {
  await page.goto('/')
  // Wait for hydration so the form's submit handler is attached before we submit.
  await page.waitForLoadState('networkidle')
  const box = page.getByRole('searchbox', { name: /Buscar productos/i })
  await box.fill('balón')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/buscar\?q=/)
  await expect(page.getByRole('heading', { name: /Resultados para/i })).toBeVisible()
  // at least one product card links to a detail page
  await expect(page.locator('a[href^="/productos/"]').first()).toBeVisible()
})

test('a nonsense query shows no results', async ({ page }) => {
  await page.goto('/buscar?q=zzzznotaproduct')
  await expect(page.getByText(/No hay productos/i)).toBeVisible()
})
