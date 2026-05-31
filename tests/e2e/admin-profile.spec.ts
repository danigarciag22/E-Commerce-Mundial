import { test, expect } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
test.skip(!email || !password, 'needs E2E_ADMIN_EMAIL/PASSWORD')

test('profile page shows card and form', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email!)
  await page.getByLabel('Contraseña').fill(password!)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.getByRole('button', { name: /Salir/i })).toBeVisible()
  await page.goto('/admin/perfil')
  await expect(page.getByRole('heading', { name: /Perfil/i })).toBeVisible()
  await expect(page.getByText('Administrador')).toBeVisible()
  await expect(page.getByRole('button', { name: /Guardar perfil/i })).toBeVisible()
})
