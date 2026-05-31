import { test, expect } from '@playwright/test'

test('add a product and manage it in the cart drawer', async ({ page }) => {
  await page.goto('/')
  await page.locator('a[href^="/productos/"]').first().click()
  await expect(page).toHaveURL(/\/productos\//)

  await page.getByRole('button', { name: /Agregar al carrito/i }).click()

  // The header cart control is now a button that opens the cart drawer.
  // Scope to the header so the footer's "Carrito" link doesn't clash.
  await page.getByRole('banner').getByRole('button', { name: /Carrito/i }).click()

  // Drawer shows the item and the checkout CTA.
  await expect(page.getByRole('button', { name: /Proceder al Pago/i })).toBeVisible()

  // increase quantity (qty controls live inside the drawer)
  await page.getByRole('button', { name: 'Aumentar' }).click()

  // remove empties the cart (trash button aria-label is "Quitar <name>")
  await page.getByRole('button', { name: /Quitar/i }).first().click()
  await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible()
})

test('empty cart shows empty message', async ({ page }) => {
  await page.goto('/carrito')
  await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible()
})
