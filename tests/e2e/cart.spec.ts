import { test, expect } from '@playwright/test'

test('add a product to cart and manage it on the cart page', async ({ page }) => {
  await page.goto('/')
  await page.locator('a[href^="/productos/"]').first().click()
  await expect(page).toHaveURL(/\/productos\//)

  await page.getByRole('button', { name: /Agregar al carrito/i }).click()

  // CartButton aria-label is "Carrito" (no items) or "Carrito, N artículos" (with items).
  // Scope to the header so the footer's "Carrito" link doesn't cause a strict-mode clash.
  await page.getByRole('banner').getByRole('link', { name: /Carrito/i }).click()
  await expect(page).toHaveURL(/\/carrito/)
  await expect(page.getByRole('heading', { name: /Tu carrito/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Quitar/i })).toBeVisible()

  // increase quantity to 2 — group aria-label is "Cantidad de <product name>"
  await page.getByRole('button', { name: 'Aumentar' }).click()
  // qty is a plain <span> inside the group; scoping to the group avoids matching prices
  await expect(
    page.getByRole('group', { name: /Cantidad/i }).getByText('2', { exact: true }),
  ).toBeVisible()

  // remove empties the cart
  await page.getByRole('button', { name: /Quitar/i }).click()
  await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible()
})

test('empty cart shows empty message', async ({ page }) => {
  await page.goto('/carrito')
  await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible()
})
