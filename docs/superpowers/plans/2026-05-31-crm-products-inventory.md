# CRM Products + Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** An interactive products table (search, sort, paginate, category filter, low-stock badge, toggle active, delete-with-confirmation) with the create/edit form extended for stock + active; plus an Inventory page (stock-focused table, quick inline stock edit, low-stock filter, KPIs).

**Architecture:** Products list fetches all products server-side (small dataset) and hands them to a client `ProductsTable` that does search/sort/pagination in-browser (instant, no reload) via a pure, tested `applyTableView` helper. Mutations are existing Server Actions (extended): create/update now carry stock+active; new `toggleProductActiveAction` and `updateStockAction`. Delete uses a client confirm. Inventory reuses the data with a stock lens. All gated by `requireAdmin` (layout) + admin RLS session (no service-role).

**Tech Stack:** Next.js 16, TypeScript, Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, EXTEND — do NOT recreate):**
> - `src/lib/products/validateProductInput.ts` — `validateProductInput(raw)` → `{ok,data:ProductInput}|{ok:false,errors}`; `ProductInput = {name,sku,price,category,description}`. EXTEND with `stock`, `active`.
> - `src/lib/products/adminProducts.ts` — `createProduct/updateProduct/deleteProduct(client,...)`. ADD `toggleProductActive`, `updateStock`.
> - `src/lib/products/productActions.ts` — `createProductAction/updateProductAction/deleteProductAction`. ADD `toggleProductActiveAction`, `updateStockAction`.
> - `src/components/admin/ProductForm.tsx` — EXTEND with stock + active fields.
> - `src/app/admin/productos/page.tsx` — REPLACE list with interactive table.
> - `src/lib/products/getProducts.ts` — `getProducts(client, filters?)` returns `Product[]` (currently maps id,name,sku,price,description,category — EXTEND mapping to include stock, active).
> - `src/lib/products/types.ts` — `Product`, `ProductCategory`, `PRODUCT_CATEGORIES`. EXTEND `Product` with `stock`, `active`.
> - `cn` at `src/lib/utils.ts`. COP formatter pattern as elsewhere.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/products/types.ts` | + `stock`, `active` on `Product` |
| `src/lib/products/getProducts.ts` | map stock/active |
| `src/lib/products/validateProductInput.ts` | + stock, active |
| `src/lib/products/adminProducts.ts` | + toggleProductActive, updateStock |
| `src/lib/products/productActions.ts` | + toggleProductActiveAction, updateStockAction |
| `src/lib/table/applyTableView.ts` | Pure search/sort/paginate helper |
| `tests/lib/table/applyTableView.test.ts` | helper tests |
| `tests/lib/products/validateProductInput.test.ts` | extend |
| `src/components/admin/ProductsTable.tsx` | Interactive client table |
| `src/components/admin/DeleteProductButton.tsx` | Confirm-then-delete (client) |
| `src/components/admin/StockEditor.tsx` | Inline stock edit (client) |
| `src/components/admin/ProductForm.tsx` | + stock + active |
| `src/app/admin/productos/page.tsx` | Uses ProductsTable |
| `src/app/admin/inventario/page.tsx` | Inventory page |
| `tests/e2e/admin-products.spec.ts` | E2E (skips without admin creds) |

---

## Task 1: Extend Product type + getProducts mapping

**Files:**
- Modify: `src/lib/products/types.ts`
- Modify: `src/lib/products/getProducts.ts`

- [ ] **Step 1: Add fields to `Product`**

In `src/lib/products/types.ts`, extend the `Product` type with:
```typescript
  stock: number
  active: boolean
```
(Keep existing fields. `ProductCategory`, `PRODUCT_CATEGORIES`, `ProductFilters` unchanged.)

- [ ] **Step 2: Map them in `getProducts`**

In `src/lib/products/getProducts.ts`, in the row mapping add:
```typescript
    stock: Number(row.stock),
    active: row.active,
```
(The select is `'*'`, so stock/active are present.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit`. Existing getProducts tests use a fake client returning rows without stock/active → mapping yields `stock: NaN`/`active: undefined` but those tests assert specific objects. CHECK: the existing `tests/lib/products/getProducts.test.ts` asserts exact `toEqual` on mapped objects WITHOUT stock/active — adding fields will BREAK those assertions. Update those test fixtures to include `stock`/`active` in both input rows and expected output (e.g. input row `stock: '5', active: true`; expected `stock: 5, active: true`). Run `npm test -- getProducts` → green.

- [ ] **Step 4: Commit**

```bash
git add src/lib/products/types.ts src/lib/products/getProducts.ts tests/lib/products/getProducts.test.ts
git commit -m "feat: add stock and active to Product"
```

---

## Task 2: Extend validateProductInput (TDD)

**Files:**
- Modify: `tests/lib/products/validateProductInput.test.ts`
- Modify: `src/lib/products/validateProductInput.ts`

- [ ] **Step 1: Add failing tests**

Add to the existing describe block:
```typescript
  it('coerces stock to a non-negative integer', () => {
    const r = validateProductInput({ ...valid, stock: '25' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.stock).toBe(25)
  })
  it('defaults stock to 0 when empty', () => {
    const r = validateProductInput({ ...valid, stock: '' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.stock).toBe(0)
  })
  it('rejects negative stock', () => {
    expect(validateProductInput({ ...valid, stock: '-3' }).ok).toBe(false)
  })
  it('parses active from "on"/"true"', () => {
    const r = validateProductInput({ ...valid, active: 'on' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.active).toBe(true)
  })
  it('active defaults false when absent', () => {
    const r = validateProductInput({ ...valid })  // no active key
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.active).toBe(false)
  })
```
(Update the existing `valid` fixture's expected `data` assertions to include `stock` and `active` so the first test still matches — the "accepts valid input" test must now expect `stock` and `active` in `data`. Set the base `valid` to include `stock: '10'` and `active: 'on'`, and update its expectation to `stock: 10, active: true`.)

- [ ] **Step 2: Run — confirm FAIL** (`npm test -- validateProductInput`).

- [ ] **Step 3: Implement**

Extend `RawInput` with `stock?: string; active?: string`, `ProductInput` with `stock: number; active: boolean`. In the function, after price validation:
```typescript
  const stockRaw = raw.stock ?? ''
  const stock = stockRaw === '' ? 0 : Number(stockRaw)
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'El stock debe ser un entero ≥ 0'
  }
```
And in the success return add:
```typescript
      stock,
      active: raw.active === 'on' || raw.active === 'true',
```
(Checkbox inputs submit `'on'` when checked, absent when not — so `active` defaults false. `errors` keyed type gains `stock`.)

- [ ] **Step 4: Run — confirm PASS** (`npm test -- validateProductInput`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/products/validateProductInput.ts tests/lib/products/validateProductInput.test.ts
git commit -m "feat: validate stock and active in product input"
```

---

## Task 3: applyTableView helper (TDD, pure)

**Files:**
- Create: `tests/lib/table/applyTableView.test.ts`
- Create: `src/lib/table/applyTableView.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/lib/table/applyTableView.test.ts
import { describe, it, expect } from 'vitest'
import { applyTableView } from '@/lib/table/applyTableView'

type Row = { name: string; sku: string; price: number }
const rows: Row[] = [
  { name: 'Balón', sku: 'B-1', price: 200 },
  { name: 'Camiseta', sku: 'C-1', price: 350 },
  { name: 'Gorra', sku: 'G-1', price: 80 },
  { name: 'Botines', sku: 'Z-1', price: 900 },
]

describe('applyTableView', () => {
  it('filters by search across given keys (case-insensitive)', () => {
    const r = applyTableView(rows, { search: 'bal', searchKeys: ['name', 'sku'], page: 1, pageSize: 10 })
    expect(r.rows.map((x) => x.name)).toEqual(['Balón'])
    expect(r.total).toBe(1)
  })
  it('sorts ascending and descending by key', () => {
    const asc = applyTableView(rows, { sortKey: 'price', sortDir: 'asc', page: 1, pageSize: 10 })
    expect(asc.rows.map((x) => x.price)).toEqual([80, 200, 350, 900])
    const desc = applyTableView(rows, { sortKey: 'price', sortDir: 'desc', page: 1, pageSize: 10 })
    expect(desc.rows.map((x) => x.price)).toEqual([900, 350, 200, 80])
  })
  it('paginates and reports totalPages', () => {
    const r = applyTableView(rows, { page: 2, pageSize: 2, sortKey: 'price', sortDir: 'asc' })
    expect(r.rows.map((x) => x.price)).toEqual([350, 900])
    expect(r.total).toBe(4)
    expect(r.totalPages).toBe(2)
  })
  it('returns all when no options', () => {
    expect(applyTableView(rows, { page: 1, pageSize: 10 }).rows).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run — confirm FAIL** (`npm test -- applyTableView`).

- [ ] **Step 3: Implement**

```typescript
// src/lib/table/applyTableView.ts
export type SortDir = 'asc' | 'desc'

export type TableViewOptions<T> = {
  search?: string
  searchKeys?: (keyof T)[]
  sortKey?: keyof T
  sortDir?: SortDir
  page: number
  pageSize: number
}

export type TableViewResult<T> = {
  rows: T[]
  total: number
  totalPages: number
}

export function applyTableView<T>(rows: T[], opts: TableViewOptions<T>): TableViewResult<T> {
  let out = [...rows]

  const search = opts.search?.trim().toLowerCase()
  if (search && opts.searchKeys?.length) {
    out = out.filter((row) =>
      opts.searchKeys!.some((k) => String(row[k] ?? '').toLowerCase().includes(search)),
    )
  }

  if (opts.sortKey) {
    const key = opts.sortKey
    const dir = opts.sortDir === 'desc' ? -1 : 1
    out.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }

  const total = out.length
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize))
  const start = (opts.page - 1) * opts.pageSize
  const paged = out.slice(start, start + opts.pageSize)

  return { rows: paged, total, totalPages }
}
```

- [ ] **Step 4: Run — confirm PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/table/applyTableView.ts tests/lib/table/applyTableView.test.ts
git commit -m "feat: add applyTableView table helper"
```

---

## Task 4: adminProducts + actions (toggle active, update stock)

**Files:**
- Modify: `src/lib/products/adminProducts.ts`
- Modify: `src/lib/products/productActions.ts`

- [ ] **Step 1: Add helpers to `adminProducts.ts`**

```typescript
export async function toggleProductActive(
  client: SupabaseClient<Database>, id: string, active: boolean,
): Promise<void> {
  const { error } = await client.from('products').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateStock(
  client: SupabaseClient<Database>, id: string, stock: number,
): Promise<void> {
  const { error } = await client.from('products').update({ stock }).eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Add actions to `productActions.ts`**

```typescript
export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return
  const { toggleProductActive } = await import('./adminProducts')
  await toggleProductActive(await createClient(), id, active)
  revalidatePath('/admin/productos')
  revalidatePath('/')
}

export async function updateStockAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const stock = Number(formData.get('stock'))
  if (!id || !Number.isInteger(stock) || stock < 0) return
  const { updateStock } = await import('./adminProducts')
  await updateStock(await createClient(), id, stock)
  revalidatePath('/admin/inventario')
  revalidatePath('/admin/productos')
  revalidatePath('/')
}
```
(Top-of-file imports of `createClient`, `requireAdmin`, `revalidatePath` already exist. The dynamic `import('./adminProducts')` avoids a static-import churn; a normal top import of the two new names is equally fine — implementer may use whichever keeps it clean.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/products/adminProducts.ts src/lib/products/productActions.ts
git commit -m "feat: add toggle-active and update-stock product actions"
```

---

## Task 5: ProductsTable + DeleteProductButton + products page

**Files:**
- Create: `src/components/admin/DeleteProductButton.tsx`
- Create: `src/components/admin/ProductsTable.tsx`
- Modify: `src/app/admin/productos/page.tsx`

- [ ] **Step 1: DeleteProductButton (client, confirm)**

```tsx
// src/components/admin/DeleteProductButton.tsx
'use client'

import { deleteProductAction } from '@/lib/products/productActions'

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-destructive hover:underline">
        Eliminar
      </button>
    </form>
  )
}
```

- [ ] **Step 2: ProductsTable (client, interactive)**

Takes `products: Product[]`. Local state: `search`, `sortKey`, `sortDir`, `page`. Uses `applyTableView`. Columns: Nombre, SKU, Categoría, Precio (COP), Stock (low-stock ≤5 red badge), Estado (Activo/Inactivo via toggle form posting `toggleProductActiveAction`), acciones (Editar link → `/admin/productos/[id]`, DeleteProductButton). Search input + clickable sortable headers (Nombre/Precio/Stock) + pagination controls (pageSize 10).

```tsx
// src/components/admin/ProductsTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/products/types'
import { applyTableView, type SortDir } from '@/lib/table/applyTableView'
import { toggleProductActiveAction } from '@/lib/products/productActions'
import { DeleteProductButton } from './DeleteProductButton'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const PAGE_SIZE = 10

export function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const view = applyTableView(products, {
    search, searchKeys: ['name', 'sku'], sortKey, sortDir, page, pageSize: PAGE_SIZE,
  })

  function toggleSort(key: keyof Product) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const Th = ({ label, k }: { label: string; k?: keyof Product }) => (
    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
      {k ? (
        <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
          {label}{sortKey === k && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
        </button>
      ) : label}
    </th>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nombre o SKU…"
          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Link href="/admin/productos/nuevo" className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Nuevo producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <Th label="Nombre" k="name" />
              <Th label="SKU" />
              <Th label="Categoría" />
              <Th label="Precio" k="price" />
              <Th label="Stock" k="stock" />
              <Th label="Estado" />
              <Th label="" />
            </tr>
          </thead>
          <tbody>
            {view.rows.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-medium">{p.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.sku}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.category}</td>
                <td className="px-3 py-2.5 tabular-nums">{cop.format(p.price)}</td>
                <td className="px-3 py-2.5">
                  <span className={cn('tabular-nums', p.stock <= 5 && 'font-semibold text-destructive')}>{p.stock}</span>
                </td>
                <td className="px-3 py-2.5">
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={(!p.active).toString()} />
                    <button type="submit" className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      p.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground',
                    )}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/productos/${p.id}`} className="text-sm font-medium hover:underline">Editar</Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {view.rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{view.total} productos</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Anterior</button>
          <span>{page} / {view.totalPages}</span>
          <button type="button" disabled={page >= view.totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace products page**

```tsx
// src/app/admin/productos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { ProductsTable } from '@/components/admin/ProductsTable'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const products = await getProducts(supabase)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
      <ProductsTable products={products} />
    </div>
  )
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke as admin: `/admin/productos` table renders, search filters, header sort toggles, pagination works, toggle activo flips the badge, delete prompts confirm. Stop server, free port 3000.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DeleteProductButton.tsx src/components/admin/ProductsTable.tsx src/app/admin/productos/page.tsx
git commit -m "feat: add interactive products table with sort/search/toggle"
```

---

## Task 6: Extend ProductForm (stock + active)

**Files:**
- Modify: `src/components/admin/ProductForm.tsx`

- [ ] **Step 1: Add fields**

Add to the `Defaults` type: `stock?: number | string; active?: boolean`. Add two fields to the form before the submit button:
- Stock: `<input id="stock" name="stock" type="number" min="0" defaultValue={d.stock ?? 0} />` with the same field classes, label "Stock", and an error slot `{state?.errors?.stock && ...}`.
- Active: a checkbox `<input id="active" name="active" type="checkbox" defaultChecked={d.active ?? true} />` with label "Producto activo (visible en la tienda)".

(The validate layer reads `active === 'on'`; an unchecked checkbox omits the field → false. For NEW products default the checkbox checked; for edit use `d.active`.)

- [ ] **Step 2: Pass defaults from edit page**

In `src/app/admin/productos/[id]/page.tsx`, add `stock: product.stock, active: product.active` to the `defaults` prop. (Product now has stock/active from Task 1.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: create a product with stock 20 active; edit it, change stock; both persist.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ProductForm.tsx src/app/admin/productos/
git commit -m "feat: add stock and active fields to product form"
```

---

## Task 7: Inventory page

**Files:**
- Create: `src/components/admin/StockEditor.tsx`
- Create: `src/app/admin/inventario/page.tsx`

- [ ] **Step 1: StockEditor (client inline edit)**

```tsx
// src/components/admin/StockEditor.tsx
'use client'

import { updateStockAction } from '@/lib/products/productActions'

export function StockEditor({ id, stock }: { id: string; stock: number }) {
  return (
    <form action={updateStockAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="stock"
        type="number"
        min="0"
        defaultValue={stock}
        className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted">Guardar</button>
    </form>
  )
}
```

- [ ] **Step 2: Inventory page**

```tsx
// src/app/admin/inventario/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { StockEditor } from '@/components/admin/StockEditor'
import { cn } from '@/lib/utils'

function stockState(stock: number) {
  if (stock === 0) return { label: 'Agotado', cls: 'bg-destructive/10 text-destructive' }
  if (stock <= 5) return { label: 'Bajo', cls: 'bg-amber-100 text-amber-800' }
  return { label: 'OK', cls: 'bg-green-100 text-green-800' }
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ low?: string }> }) {
  const { low } = await searchParams
  const onlyLow = low === '1'

  const supabase = await createClient()
  const all = await getProducts(supabase)
  const products = onlyLow ? all.filter((p) => p.stock <= 5) : all

  const totalSkus = all.length
  const outOfStock = all.filter((p) => p.stock === 0).length
  const lowStock = all.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="SKUs" value={String(totalSkus)} />
        <Kpi label="Agotados" value={String(outOfStock)} />
        <Kpi label="Bajo stock" value={String(lowStock)} />
      </div>

      <div className="flex gap-2 text-sm">
        <a href="/admin/inventario" className={cn('rounded-full border px-3 py-1', !onlyLow ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>Todos</a>
        <a href="/admin/inventario?low=1" className={cn('rounded-full border px-3 py-1', onlyLow ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>Solo bajo stock</a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Producto</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const st = stockState(p.stock)
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium">{p.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.sku}</td>
                  <td className="px-3 py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>{st.label}</span></td>
                  <td className="px-3 py-2.5"><StockEditor id={p.id} stock={p.stock} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: `/admin/inventario` shows KPIs + table, "solo bajo stock" filters, editing a stock value + Guardar persists (refresh shows new value). Stop server, free port 3000.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/StockEditor.tsx src/app/admin/inventario/
git commit -m "feat: add inventory page with quick stock edit"
```

---

## Task 8: E2E (skips without admin creds)

**Files:**
- Create: `tests/e2e/admin-products.spec.ts`

- [ ] **Step 1: Write the test** (mirrors the `admin.spec.ts` skip-guard pattern)

```typescript
// tests/e2e/admin-products.spec.ts
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
```

- [ ] **Step 2: Run** — `npx playwright test admin-products` (skips cleanly without env). Full `npx playwright test` all pass/skip. Port 3000 free.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin-products.spec.ts
git commit -m "test: add admin products/inventory e2e (skips without creds)"
```

---

## Self-Review

- **Spec coverage:** Productos module (interactive table search/sort/paginate/filter, low-stock badge, toggle active, delete-with-confirm, form stock/active) — Tasks 1-6; Inventario (stock table, quick edit, low-stock filter, KPIs) — Task 7; E2E — Task 8.
- **Placeholder scan:** No TBD. Collections assignment intentionally lives in the Colecciones plan, not the product form (noted in architecture).
- **Type consistency:** `Product` gains `stock`/`active` (Task 1) used by getProducts, ProductsTable, inventory, form. `ProductInput` gains `stock`/`active` (Task 2) flowing through `createProduct`/`updateProduct` (insert `input`). `applyTableView` generic over `Product`. Actions `toggleProductActiveAction`/`updateStockAction` consumed by ProductsTable/StockEditor.
- **Security:** All reads/writes via admin session + RLS (`is_admin()` policies from the recursion fix). Delete confirm is client UX; the real gate is `requireAdmin` in the action.
- **Regression note:** Task 1 explicitly updates the existing getProducts + validateProductInput tests for the new fields so the suite stays green.
