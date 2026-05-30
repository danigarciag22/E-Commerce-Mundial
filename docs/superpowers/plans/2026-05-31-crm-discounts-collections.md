# CRM Discounts + Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Two CRUD modules — Descuentos (code, percent, active, expiry) and Colecciones (name, slug, description, with product assignment) — completing the CRM.

**Architecture:** Pure validation (discount + collection input) is unit-tested. CRUD via Server Actions gated by `requireAdmin` on the admin RLS session (existing "admins manage discounts/collections/product_collections" policies). Lists are server-rendered (small datasets); create/edit use `useActionState` forms. Collection product-assignment uses a multi-checkbox form writing `product_collections`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, do NOT recreate):**
> - `src/lib/supabase/server.ts` (`createClient`), `src/lib/auth/guards.ts` (`requireAdmin`).
> - `discounts` table: id, code, percent (1-100), active, expires_at, created_at. RLS "admins manage discounts" (all).
> - `collections`: id, name, slug, description, created_at. `product_collections`: product_id, collection_id. RLS "admins manage collections"/"admins manage product_collections" + public read.
> - `getProducts(client)` → Product[] (for the assignment UI).
> - `PRODUCT_CATEGORIES` etc. `cn` at `src/lib/utils.ts`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/discounts/validateDiscount.ts` | pure validate (code, percent, expiry) |
| `tests/lib/discounts/validateDiscount.test.ts` | tests |
| `src/lib/discounts/discountActions.ts` | create/toggle/delete actions |
| `src/lib/discounts/getDiscounts.ts` | list |
| `src/lib/collections/slugify.ts` | pure slugify |
| `tests/lib/collections/slugify.test.ts` | tests |
| `src/lib/collections/collectionActions.ts` | create/delete/assign actions |
| `src/lib/collections/getCollections.ts` | list with product counts |
| `src/components/admin/DiscountForm.tsx`, `DeleteButton.tsx` (shared confirm) | forms |
| `src/app/admin/descuentos/page.tsx` | discounts CRUD |
| `src/app/admin/colecciones/page.tsx` | collections list + create |
| `src/app/admin/colecciones/[id]/page.tsx` | assign products |
| `tests/e2e/admin-discounts.spec.ts` | E2E (skips without creds) |

---

## Task 1: validateDiscount (TDD, pure)

**Files:**
- Create: `tests/lib/discounts/validateDiscount.test.ts`, `src/lib/discounts/validateDiscount.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/discounts/validateDiscount.test.ts
import { describe, it, expect } from 'vitest'
import { validateDiscount } from '@/lib/discounts/validateDiscount'

describe('validateDiscount', () => {
  it('accepts valid input and uppercases the code', () => {
    const r = validateDiscount({ code: 'mundial10', percent: '10', expires_at: '2030-01-01' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.code).toBe('MUNDIAL10')
      expect(r.data.percent).toBe(10)
      expect(r.data.expires_at).toBe('2030-01-01')
    }
  })
  it('allows empty expiry as null', () => {
    const r = validateDiscount({ code: 'X', percent: '5', expires_at: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.expires_at).toBeNull()
  })
  it('rejects empty code', () => {
    expect(validateDiscount({ code: '', percent: '5' }).ok).toBe(false)
  })
  it('rejects percent out of 1..100', () => {
    expect(validateDiscount({ code: 'A', percent: '0' }).ok).toBe(false)
    expect(validateDiscount({ code: 'A', percent: '101' }).ok).toBe(false)
    expect(validateDiscount({ code: 'A', percent: 'x' }).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run — FAIL** (`npm test -- validateDiscount`).

- [ ] **Step 3: Implement**

```typescript
// src/lib/discounts/validateDiscount.ts
export type DiscountInput = { code: string; percent: number; expires_at: string | null }

type Raw = { code?: string; percent?: string; expires_at?: string }

export type DiscountResult =
  | { ok: true; data: DiscountInput }
  | { ok: false; errors: Partial<Record<keyof Raw, string>> }

export function validateDiscount(raw: Raw): DiscountResult {
  const errors: Partial<Record<keyof Raw, string>> = {}
  const code = (raw.code ?? '').trim().toUpperCase()
  if (!code) errors.code = 'Código obligatorio'
  const percent = Number(raw.percent)
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    errors.percent = 'El porcentaje debe estar entre 1 y 100'
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const exp = (raw.expires_at ?? '').trim()
  return { ok: true, data: { code, percent, expires_at: exp === '' ? null : exp } }
}
```

- [ ] **Step 4: Run — PASS** (4 tests). **Step 5: Commit** `feat: add discount validation`.

---

## Task 2: slugify (TDD, pure)

**Files:**
- Create: `tests/lib/collections/slugify.test.ts`, `src/lib/collections/slugify.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/collections/slugify.test.ts
import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/collections/slugify'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Selección Colombia')).toBe('seleccion-colombia')
  })
  it('strips accents and symbols', () => {
    expect(slugify('Mundial 2026 ⚽!')).toBe('mundial-2026')
  })
  it('collapses spaces and trims hyphens', () => {
    expect(slugify('  Ofertas   Especiales  ')).toBe('ofertas-especiales')
  })
  it('returns empty for empty', () => {
    expect(slugify('')).toBe('')
  })
})
```

- [ ] **Step 2: Run — FAIL**. **Step 3: Implement**

```typescript
// src/lib/collections/slugify.ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run — PASS** (4 tests). **Step 5: Commit** `feat: add slugify`.

---

## Task 3: Discounts data + actions

**Files:**
- Create: `src/lib/discounts/getDiscounts.ts`, `src/lib/discounts/discountActions.ts`

- [ ] **Step 1: getDiscounts**

```typescript
// src/lib/discounts/getDiscounts.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Discount = { id: string; code: string; percent: number; active: boolean; expires_at: string | null }

export async function getDiscounts(client: SupabaseClient<Database>): Promise<Discount[]> {
  const { data, error } = await client.from('discounts').select('id, code, percent, active, expires_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => ({ id: d.id, code: d.code, percent: d.percent, active: d.active, expires_at: d.expires_at }))
}
```

- [ ] **Step 2: discountActions**

```typescript
// src/lib/discounts/discountActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { validateDiscount } from './validateDiscount'

export type DiscountFormState = { errors?: Record<string, string>; error?: string } | null

export async function createDiscountAction(_prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin()
  const result = validateDiscount({
    code: String(formData.get('code') ?? ''),
    percent: String(formData.get('percent') ?? ''),
    expires_at: String(formData.get('expires_at') ?? ''),
  })
  if (!result.ok) return { errors: result.errors }
  const supabase = await createClient()
  const { error } = await supabase.from('discounts').insert(result.data)
  if (error) return { error: 'No se pudo crear (¿código duplicado?)' }
  revalidatePath('/admin/descuentos')
  return null
}

export async function toggleDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return
  const supabase = await createClient()
  await supabase.from('discounts').update({ active }).eq('id', id)
  revalidatePath('/admin/descuentos')
}

export async function deleteDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  await supabase.from('discounts').delete().eq('id', id)
  revalidatePath('/admin/descuentos')
}
```

- [ ] **Step 3: Verify** tsc clean. **Step 4: Commit** `feat: add discount data and actions`.

---

## Task 4: Collections data + actions

**Files:**
- Create: `src/lib/collections/getCollections.ts`, `src/lib/collections/collectionActions.ts`

- [ ] **Step 1: getCollections (with product counts) + getCollection + assigned ids**

```typescript
// src/lib/collections/getCollections.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Collection = { id: string; name: string; slug: string; description: string | null; productCount: number }

export async function getCollections(client: SupabaseClient<Database>): Promise<Collection[]> {
  const { data, error } = await client.from('collections').select('id, name, slug, description, product_collections(count)').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    productCount: Array.isArray(c.product_collections) && c.product_collections[0] ? Number((c.product_collections[0] as { count: number }).count) : 0,
  }))
}

export async function getCollection(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client.from('collections').select('id, name, slug, description').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getAssignedProductIds(client: SupabaseClient<Database>, collectionId: string): Promise<string[]> {
  const { data, error } = await client.from('product_collections').select('product_id').eq('collection_id', collectionId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.product_id)
}
```

> The `product_collections(count)` embed shape may vary; if it doesn't type/parse cleanly, fall back to fetching all product_collections rows and counting per collection in JS. Verify against the generated types.

- [ ] **Step 2: collectionActions**

```typescript
// src/lib/collections/collectionActions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { slugify } from './slugify'

export type CollectionFormState = { error?: string } | null

export async function createCollectionAction(_prev: CollectionFormState, formData: FormData): Promise<CollectionFormState> {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  if (!name) return { error: 'El nombre es obligatorio' }
  const slug = slugify(name)
  const supabase = await createClient()
  const { error } = await supabase.from('collections').insert({ name, slug, description })
  if (error) return { error: 'No se pudo crear (¿nombre/slug duplicado?)' }
  revalidatePath('/admin/colecciones')
  return null
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  await supabase.from('collections').delete().eq('id', id)
  revalidatePath('/admin/colecciones')
}

export async function setCollectionProductsAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const collectionId = String(formData.get('collection_id') ?? '')
  if (!collectionId) return
  const productIds = formData.getAll('product_id').map(String)
  const supabase = await createClient()
  // Replace the set: delete existing, insert selected.
  await supabase.from('product_collections').delete().eq('collection_id', collectionId)
  if (productIds.length > 0) {
    await supabase.from('product_collections').insert(productIds.map((pid) => ({ collection_id: collectionId, product_id: pid })))
  }
  revalidatePath('/admin/colecciones')
  revalidatePath(`/admin/colecciones/${collectionId}`)
}
```

- [ ] **Step 3: Verify** tsc clean. **Step 4: Commit** `feat: add collection data and actions`.

---

## Task 5: Discounts page

**Files:**
- Create: `src/components/admin/DeleteButton.tsx` (shared confirm), `src/components/admin/DiscountForm.tsx`, `src/app/admin/descuentos/page.tsx`

- [ ] **Step 1: DeleteButton (generic confirm)**

```tsx
// src/components/admin/DeleteButton.tsx
'use client'

type Action = (formData: FormData) => void | Promise<void>

export function DeleteButton({ action, id, label = 'Eliminar', confirmText }: { action: Action; id: string; label?: string; confirmText: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(confirmText)) e.preventDefault() }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-destructive hover:underline">{label}</button>
    </form>
  )
}
```

- [ ] **Step 2: DiscountForm (client, useActionState)**

```tsx
// src/components/admin/DiscountForm.tsx
'use client'

import { useActionState } from 'react'
import { createDiscountAction, type DiscountFormState } from '@/lib/discounts/discountActions'

export function DiscountForm() {
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(createDiscountAction, null)
  const field = 'rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-xs font-medium text-muted-foreground">Código</label>
        <input id="code" name="code" className={field} placeholder="MUNDIAL10" />
        {state?.errors?.code && <span className="text-xs text-destructive">{state.errors.code}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="percent" className="text-xs font-medium text-muted-foreground">% Descuento</label>
        <input id="percent" name="percent" type="number" min="1" max="100" className={field} />
        {state?.errors?.percent && <span className="text-xs text-destructive">{state.errors.percent}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="expires_at" className="text-xs font-medium text-muted-foreground">Expira (opcional)</label>
        <input id="expires_at" name="expires_at" type="date" className={field} />
      </div>
      <button type="submit" disabled={pending} className="h-[38px] rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear'}
      </button>
      {state?.error && <span className="w-full text-xs text-destructive">{state.error}</span>}
    </form>
  )
}
```

- [ ] **Step 3: Discounts page**

```tsx
// src/app/admin/descuentos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getDiscounts } from '@/lib/discounts/getDiscounts'
import { DiscountForm } from '@/components/admin/DiscountForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { toggleDiscountAction, deleteDiscountAction } from '@/lib/discounts/discountActions'
import { cn } from '@/lib/utils'

export default async function AdminDiscountsPage() {
  const supabase = await createClient()
  const discounts = await getDiscounts(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Descuentos</h1>
      <DiscountForm />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">%</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expira</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono font-medium">{d.code}</td>
                <td className="px-3 py-2.5 tabular-nums">{d.percent}%</td>
                <td className="px-3 py-2.5">
                  <form action={toggleDiscountAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="active" value={(!d.active).toString()} />
                    <button type="submit" className={cn('rounded-full px-2 py-0.5 text-xs font-medium', d.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground')}>
                      {d.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{d.expires_at ? new Date(d.expires_at).toLocaleDateString('es-CO') : 'Sin vencimiento'}</td>
                <td className="px-3 py-2.5"><DeleteButton action={deleteDiscountAction} id={d.id} confirmText={`¿Eliminar el código ${d.code}?`} /></td>
              </tr>
            ))}
            {discounts.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Sin descuentos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify** tsc + build clean. Smoke: create a discount, toggle, delete (confirm). **Step 5: Commit** `feat: add discounts admin page`.

---

## Task 6: Collections pages

**Files:**
- Create: `src/components/admin/CollectionForm.tsx`, `src/app/admin/colecciones/page.tsx`, `src/app/admin/colecciones/[id]/page.tsx`

- [ ] **Step 1: CollectionForm (client, useActionState)** — name + description, submit "Crear colección"; mirror DiscountForm structure using `createCollectionAction`/`CollectionFormState`.

- [ ] **Step 2: Collections list page**

```tsx
// src/app/admin/colecciones/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCollections } from '@/lib/collections/getCollections'
import { CollectionForm } from '@/components/admin/CollectionForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deleteCollectionAction } from '@/lib/collections/collectionActions'

export default async function AdminCollectionsPage() {
  const supabase = await createClient()
  const collections = await getCollections(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Colecciones</h1>
      <CollectionForm />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground">/{c.slug} · {c.productCount} productos</p>
              </div>
              <DeleteButton action={deleteCollectionAction} id={c.id} confirmText={`¿Eliminar la colección ${c.name}?`} />
            </div>
            {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
            <Link href={`/admin/colecciones/${c.id}`} className="mt-auto text-sm font-medium text-primary hover:underline">Asignar productos →</Link>
          </div>
        ))}
        {collections.length === 0 && <p className="text-muted-foreground">Sin colecciones.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Collection detail (assign products)**

```tsx
// src/app/admin/colecciones/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { getCollection, getAssignedProductIds } from '@/lib/collections/getCollections'
import { setCollectionProductsAction } from '@/lib/collections/collectionActions'

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const collection = await getCollection(supabase, id)
  if (!collection) notFound()
  const [products, assigned] = await Promise.all([
    getProducts(supabase),
    getAssignedProductIds(supabase, id),
  ])
  const assignedSet = new Set(assigned)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/colecciones" className="text-sm text-muted-foreground hover:underline">← Colecciones</Link>
      <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
      <form action={setCollectionProductsAction} className="flex flex-col gap-4">
        <input type="hidden" name="collection_id" value={id} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <input type="checkbox" name="product_id" value={p.id} defaultChecked={assignedSet.has(p.id)} />
              {p.name} <span className="text-muted-foreground">· {p.category}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Guardar selección</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify** tsc + build clean. Smoke: create a collection, assign products (check several, save, reopen shows them checked), delete. **Step 5: Commit** `feat: add collections admin pages`.

---

## Task 7: E2E (skips without creds)

**Files:**
- Create: `tests/e2e/admin-discounts.spec.ts`

- [ ] **Step 1: Write** — skip-guard; login; `/admin/descuentos` heading visible + form present; `/admin/colecciones` heading visible.

```typescript
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
```

- [ ] **Step 2: Run** — skips; full suite pass/skip; port free. **Step 3: Commit** `test: add admin discounts/collections e2e (skips without creds)`.

---

## Self-Review

- **Spec coverage:** Descuentos CRUD (validate, create/toggle/delete, page) Tasks 1,3,5; Colecciones CRUD + product assignment (slugify, create/delete/assign, list+detail) Tasks 2,4,6; E2E Task 7.
- **Placeholder scan:** No TBD. getCollections count-embed has a documented JS-count fallback.
- **Type consistency:** `DiscountInput`/`Discount`, `Collection`, form-state types consumed consistently. `setCollectionProductsAction` reads multi `product_id` via `formData.getAll`. Reuses `getProducts`, `requireAdmin`, `createClient`.
- **Security:** All writes via admin session + existing "admins manage discounts/collections/product_collections" RLS, gated by `requireAdmin`. No service-role.
