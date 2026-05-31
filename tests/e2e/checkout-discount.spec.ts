import { test, expect } from '@playwright/test'

test('applies a valid discount code and rejects an invalid one', async ({ page }) => {
  await page.goto('/')
  await page.locator('a[href^="/productos/"]').first().click()
  await page.getByRole('button', { name: /Agregar al carrito/i }).click()
  await page.goto('/checkout')

  await page.getByPlaceholder(/código/i).fill('CODIGOFALSO')
  await page.getByRole('button', { name: /Aplicar/i }).click()
  await expect(page.getByText(/inválido o expirado/i)).toBeVisible()

  await page.getByPlaceholder(/código/i).fill('MUNDIAL10')
  await page.getByRole('button', { name: /Aplicar/i }).click()
  await expect(page.getByText(/MUNDIAL10/i)).toBeVisible()
})
