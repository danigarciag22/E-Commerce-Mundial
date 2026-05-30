import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('orders table lists and a detail page opens', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()

  await page.goto('/admin/ordenes')
  await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()
  await expect(page.locator('table')).toBeVisible()

  const firstView = page.getByRole('link', { name: 'Ver' }).first()
  await firstView.click()
  await expect(page).toHaveURL(/\/admin\/ordenes\//)
  await expect(page.getByRole('button', { name: /Actualizar/i })).toBeVisible()
})
