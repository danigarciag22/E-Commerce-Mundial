import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('discounts and collections pages load', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()

  await page.goto('/admin/descuentos')
  await expect(page.getByRole('heading', { name: 'Descuentos' })).toBeVisible()
  await expect(page.getByPlaceholder('MUNDIAL10')).toBeVisible()

  await page.goto('/admin/colecciones')
  await expect(page.getByRole('heading', { name: 'Colecciones' })).toBeVisible()
})
