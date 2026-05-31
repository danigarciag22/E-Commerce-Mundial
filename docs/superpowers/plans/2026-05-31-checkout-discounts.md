# Checkout Discounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let buyers enter a discount code at checkout: validate it server-side (active + not expired), preview the discounted total, and apply the percentage to the Mercado Pago preference so the charged amount reflects the discount.

**Architecture:** Pure, tested helpers do the math (`isDiscountUsable`, `applyDiscountToItems`). A server helper `validateDiscountCode(client, code)` reads the `discounts` table (public read is admin-only; discounts are admin-RLS — so this validation runs through a Server Action / API on the server using the anon client which CANNOT read discounts under RLS → use a dedicated read path). The `/checkout` page gets a code field + "Aplicar" that calls a Server Action to validate and preview. `/api/checkout` re-validates the code server-side and applies the discount to the preference items before creating it. Never trust a client-sent percentage.

> **RLS note:** `discounts` currently has only admin policies (no public/anon read). Checkout validation must read discounts WITHOUT an admin session. Add a narrow policy allowing anyone to read ACTIVE discounts (so code validation works for shoppers), OR validate via a SECURITY DEFINER function. This plan adds a public read policy limited to active discounts (Task 1).

**Tech Stack:** Next.js 16 (Server Actions, Route Handler), TypeScript, Supabase, Mercado Pago SDK v3, Vitest.

> **Existing (use, do NOT recreate):**
> - `src/lib/checkout/buildPreference.ts` — `buildPreference({items,email,siteUrl})`; items are `CartItem[]` mapped to MP items (unit_price = price).
> - `src/app/api/checkout/route.ts` — POST builds preference from `{items,email}`. EXTEND to accept `code`.
> - `src/app/(shop)/checkout/page.tsx` — client checkout (email + pay). EXTEND with code field.
> - `src/lib/cart/types.ts` — `CartItem {id,name,price,category,quantity}`.
> - `src/lib/supabase/server.ts` (`createClient`).
> - `cn`, COP formatter pattern.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0012_public_read_active_discounts.sql` | anon can read active discounts |
| `src/lib/discounts/discountMath.ts` | pure `isDiscountUsable`, `applyDiscountToItems` |
| `tests/lib/discounts/discountMath.test.ts` | tests |
| `src/lib/discounts/validateDiscountCode.ts` | server: look up + validate a code |
| `src/lib/discounts/checkDiscountAction.ts` | Server Action for the page preview |
| `src/app/api/checkout/route.ts` | apply validated discount to preference |
| `src/app/(shop)/checkout/page.tsx` | code field + preview + pass code |
| `tests/e2e/checkout-discount.spec.ts` | E2E (storefront, no MP redirect needed) |

---

## Task 1: Public read of active discounts (RLS)

**Files:**
- Create: `supabase/migrations/0012_public_read_active_discounts.sql`

- [ ] **Step 1: Write** (controller applies via MCP)

```sql
-- Shoppers (anon) may read only ACTIVE discounts to validate a code at checkout.
create policy "anyone reads active discounts" on discounts for select
  using (active = true);
```

> This coexists (permissive OR) with "admins manage discounts". Anon sees only active rows; expiry is still enforced in app logic (and could be added to the policy later).

- [ ] **Step 2: Apply via MCP** (`apply_migration` name `0012_public_read_active_discounts`).
- [ ] **Step 3: Verify** — `get_advisors` (security) no new criticals.
- [ ] **Step 4: Commit** `feat: allow anon to read active discounts (RLS)`.

---

## Task 2: Discount math (TDD, pure)

**Files:**
- Create: `tests/lib/discounts/discountMath.test.ts`, `src/lib/discounts/discountMath.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/discounts/discountMath.test.ts
import { describe, it, expect } from 'vitest'
import { isDiscountUsable, applyDiscountToItems } from '@/lib/discounts/discountMath'
import type { CartItem } from '@/lib/cart/types'

const items: CartItem[] = [
  { id: 'p1', name: 'Balón', price: 100000, category: 'balon', quantity: 2 },
  { id: 'p2', name: 'Gorra', price: 50000, category: 'merchandising', quantity: 1 },
]

describe('isDiscountUsable', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  it('usable when active and no expiry', () => {
    expect(isDiscountUsable({ active: true, expires_at: null }, now)).toBe(true)
  })
  it('usable when active and expiry in the future', () => {
    expect(isDiscountUsable({ active: true, expires_at: '2026-12-01T00:00:00Z' }, now)).toBe(true)
  })
  it('not usable when inactive', () => {
    expect(isDiscountUsable({ active: false, expires_at: null }, now)).toBe(false)
  })
  it('not usable when expired', () => {
    expect(isDiscountUsable({ active: true, expires_at: '2026-01-01T00:00:00Z' }, now)).toBe(false)
  })
})

describe('applyDiscountToItems', () => {
  it('reduces each unit price by percent (rounded) and reports totals', () => {
    const r = applyDiscountToItems(items, 10)
    expect(r.items[0].price).toBe(90000)
    expect(r.items[1].price).toBe(45000)
    expect(r.subtotal).toBe(250000)        // 100000*2 + 50000
    expect(r.total).toBe(225000)           // 90000*2 + 45000
    expect(r.discountAmount).toBe(25000)
  })
  it('returns originals for percent 0', () => {
    const r = applyDiscountToItems(items, 0)
    expect(r.items).toEqual(items)
    expect(r.discountAmount).toBe(0)
  })
})
```

- [ ] **Step 2: Run — FAIL**.
- [ ] **Step 3: Implement**

```typescript
// src/lib/discounts/discountMath.ts
import type { CartItem } from '@/lib/cart/types'

export function isDiscountUsable(d: { active: boolean; expires_at: string | null }, now: Date = new Date()): boolean {
  if (!d.active) return false
  if (d.expires_at && new Date(d.expires_at).getTime() <= now.getTime()) return false
  return true
}

export type DiscountApplication = {
  items: CartItem[]
  subtotal: number
  total: number
  discountAmount: number
}

export function applyDiscountToItems(items: CartItem[], percent: number): DiscountApplication {
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0)
  if (!percent) {
    return { items, subtotal, total: subtotal, discountAmount: 0 }
  }
  const factor = 1 - percent / 100
  const discounted = items.map((i) => ({ ...i, price: Math.round(i.price * factor) }))
  const total = discounted.reduce((n, i) => n + i.price * i.quantity, 0)
  return { items: discounted, subtotal, total, discountAmount: subtotal - total }
}
```

- [ ] **Step 4: Run — PASS** (6 tests). **Step 5: Commit** `feat: add discount math helpers`.

---

## Task 3: validateDiscountCode + checkDiscountAction

**Files:**
- Create: `src/lib/discounts/validateDiscountCode.ts`, `src/lib/discounts/checkDiscountAction.ts`

- [ ] **Step 1: validateDiscountCode (server helper)**

```typescript
// src/lib/discounts/validateDiscountCode.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { isDiscountUsable } from './discountMath'

export type ValidatedDiscount = { code: string; percent: number } | null

export async function validateDiscountCode(client: SupabaseClient<Database>, rawCode: string): Promise<ValidatedDiscount> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return null
  const { data, error } = await client
    .from('discounts')
    .select('code, percent, active, expires_at')
    .eq('code', code)
    .maybeSingle()
  if (error || !data) return null
  if (!isDiscountUsable({ active: data.active, expires_at: data.expires_at })) return null
  return { code: data.code, percent: data.percent }
}
```

- [ ] **Step 2: checkDiscountAction (Server Action for page preview)**

```typescript
// src/lib/discounts/checkDiscountAction.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { validateDiscountCode } from './validateDiscountCode'

export type CheckDiscountState = { ok: true; code: string; percent: number } | { ok: false; error: string } | null

export async function checkDiscountAction(_prev: CheckDiscountState, formData: FormData): Promise<CheckDiscountState> {
  const code = String(formData.get('code') ?? '')
  const supabase = await createClient()
  const result = await validateDiscountCode(supabase, code)
  if (!result) return { ok: false, error: 'Código inválido o expirado' }
  return { ok: true, code: result.code, percent: result.percent }
}
```

- [ ] **Step 3: Verify** tsc clean. **Step 4: Commit** `feat: add discount code validation`.

---

## Task 4: Apply discount in /api/checkout

**Files:**
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Re-validate + apply**

In the POST handler, after reading `items`/`email`, also read `code` from the body. After the existing validation, if `code` is present, validate it server-side and discount the items BEFORE buildPreference:

```typescript
// inside POST, after items/email validated, before creating the preference:
import { validateDiscountCode } from '@/lib/discounts/validateDiscountCode'
import { applyDiscountToItems } from '@/lib/discounts/discountMath'
import { createClient } from '@/lib/supabase/server'
// ...
let finalItems = items
const code = typeof body.code === 'string' ? body.code : ''
if (code) {
  const supabase = await createClient()
  const validated = await validateDiscountCode(supabase, code)
  if (validated) {
    finalItems = applyDiscountToItems(items, validated.percent).items
  }
  // invalid code → silently ignore (no discount); the page already previews validity
}
// build preference with finalItems instead of items
const result = await preference.create({ body: buildPreference({ items: finalItems, email, siteUrl }) })
```

Keep the rest (accessToken/siteUrl checks, error handling) intact. `body` is the parsed JSON; add `code?: string` to its type.

- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npm run build` clean.
- [ ] **Step 3: Commit** `feat: apply discount code to checkout preference`.

---

## Task 5: Checkout page — code field + preview

**Files:**
- Modify: `src/app/(shop)/checkout/page.tsx`

- [ ] **Step 1: Add a discount section**

The page is a client component with cart `items` + `total`. Add:
- A `useActionState(checkDiscountAction, null)` form with a `code` text input + "Aplicar" button. On success, store `{code, percent}` in component state.
- Show the applied code + discounted total (use `applyDiscountToItems(items, percent)` client-side just for the PREVIEW display — the server re-applies authoritatively).
- Include the applied `code` in the JSON POST to `/api/checkout`.
- If invalid, show the action's error message.

Implementation sketch (adapt to the existing page structure; keep email + pay flow):
```tsx
// add near the top of the component body
const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null)
const [codeState, codeAction, codePending] = useActionState(checkDiscountAction, null)
useEffect(() => {
  if (codeState?.ok) setDiscount({ code: codeState.code, percent: codeState.percent })
}, [codeState])

const preview = applyDiscountToItems(items, discount?.percent ?? 0)
// ...in handlePay body include code:
body: JSON.stringify({ items, email, code: discount?.code ?? '' }),
```

UI: a small form (separate from the pay button — it has its own action) with the code input + Aplicar; below it, when a discount is applied, show "Código X (−Y%)" and the discounted total; otherwise show the normal total. The pay button uses `preview.total` for display.

> Note: the discount form and the pay action are separate — the code form posts to `checkDiscountAction`; the pay button does the fetch to `/api/checkout`. Don't nest forms.

- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke (storefront, no real MP needed for the preview): add item → `/checkout` → enter `MUNDIAL10` → Aplicar → total drops 10%; enter a bad code → error shown. (The actual MP redirect needs the access token; the discount preview + validation work without it.) Stop server, free port.
- [ ] **Step 3: Commit** `feat: add discount code field to checkout`.

---

## Task 6: E2E (storefront)

**Files:**
- Create: `tests/e2e/checkout-discount.spec.ts`

- [ ] **Step 1: Write** — add a product, go to /checkout, apply `MUNDIAL10` (seeded, active, 10%), assert a discount indicator appears; apply a bogus code, assert the error. (Does NOT click "Pagar" — that needs MP creds.)

```typescript
// tests/e2e/checkout-discount.spec.ts
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
```

> The code input must have a placeholder containing "código" (e.g. "Código de descuento") for `getByPlaceholder(/código/i)` to match — implement the field accordingly.

- [ ] **Step 2: Run** — `npx playwright test checkout-discount`; full suite pass/skip; port free.
- [ ] **Step 3: Commit** `test: add checkout discount e2e`.

---

## Self-Review

- **Spec coverage:** Code entry + validation + preview (Tasks 2,3,5), server-side re-apply to MP preference (Task 4), RLS for shopper read (Task 1), E2E (Task 6).
- **Placeholder scan:** No TBD. Invalid code on the API path is silently ignored (no discount) since the page already gates validity — documented.
- **Type consistency:** `CartItem` reused; `applyDiscountToItems` returns `CartItem[]` fed to `buildPreference`. `ValidatedDiscount`/`CheckDiscountState` consistent across helper, action, page.
- **Security:** Code validated SERVER-SIDE in both the preview action and `/api/checkout` (never trusts a client percent). New RLS exposes only `active` discounts to anon (codes are low-sensitivity promo codes). Discount applied to unit prices server-side before preference creation.
