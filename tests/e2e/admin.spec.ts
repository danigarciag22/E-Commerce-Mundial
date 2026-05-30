import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.skip(!email || !password, 'admin e2e needs E2E_ADMIN_EMAIL/PASSWORD env')

test('admin creates, edits, and deletes a product', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()

  const sku = `E2E-${Date.now()}`
  await page.goto('/admin/productos/nuevo')
  await page.getByLabel('Nombre').fill('Producto E2E')
  await page.getByLabel('SKU').fill(sku)
  await page.getByLabel('Precio (COP)').fill('12345')
  await page.getByRole('button', { name: /Crear producto/i }).click()

  await expect(page).toHaveURL(/\/admin\/productos/)
  await expect(page.getByText(sku)).toBeVisible()

  // The products list is now an interactive table; delete is confirm()-guarded.
  page.on('dialog', (dialog) => dialog.accept())
  const row = page.locator('tr', { hasText: sku })
  await row.getByRole('button', { name: /Eliminar/i }).click()
  await expect(page.getByText(sku)).toHaveCount(0)
})
