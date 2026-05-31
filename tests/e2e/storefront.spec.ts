import { test, expect } from '@playwright/test'

test('home hero + nav to collections + collection products', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Vive el Mundial/i })).toBeVisible()

  // header nav to collections
  await page.getByRole('link', { name: 'Colecciones' }).first().click()
  await expect(page).toHaveURL(/\/colecciones/)
  await expect(page.getByRole('heading', { name: 'Colecciones' })).toBeVisible()

  // open first collection
  await page.getByRole('link', { name: /Ver productos/i }).first().click()
  await expect(page).toHaveURL(/\/colecciones\//)
})

test('footer is present on storefront', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/No afiliado a la FIFA/i)).toBeVisible()
})
