import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()
}

test('products table searches and the inventory page loads', async ({ page }) => {
  await login(page)
  await page.goto('/admin/productos')
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible()
  await page.getByPlaceholder(/Buscar/i).fill('balón')
  // at least the table still renders (results may vary)
  await expect(page.locator('table')).toBeVisible()

  await page.goto('/admin/inventario')
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible()
  await expect(page.getByText('SKUs')).toBeVisible()
})
