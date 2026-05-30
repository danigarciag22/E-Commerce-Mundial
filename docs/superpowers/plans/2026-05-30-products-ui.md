# Products UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Public, SEO-friendly product catalog: a server-rendered listing with category + price filters, and a product detail page — backed by the live Supabase `products` table, with seed data and a polished football-themed design.

**Architecture:** Next.js 16 App Router. Catalog is the home route `/` (Server Component, SSR, best for SEO). Product detail at `/productos/[id]` (SSR, generates metadata for SEO). Data access goes through typed helpers in `src/lib/products/` using the server Supabase client. Filters are driven by URL search params (shareable, SSR-friendly). UI built with Tailwind v4 + shadcn primitives, high design quality (apply frontend-design / ui-ux-pro-max principles — distinctive, not generic AI aesthetic).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase (server client), Vitest, Playwright.

> **Version note:** Next.js 16 has breaking changes (see repo `AGENTS.md`). Before writing any code using Next APIs (`searchParams`, `params`, `generateMetadata`, `<Image>`, `<Link>`), verify the current API in `node_modules/next/dist/docs/` and/or Context7. In Next 16, `params` and `searchParams` in pages are **async (Promises)** — await them.

> **Existing code (do NOT recreate):**
> - `src/lib/products/getProducts.ts` — `getProducts(client)` returns `Product[]` with `{id,name,sku,price,description,category}`. Tested.
> - `src/lib/types/database.ts` — `Database` type.
> - `src/lib/supabase/server.ts` — `createClient()` async server client.
> - `src/lib/supabase/client.ts` — browser client.
> - shadcn installed; `cn` at `src/lib/utils.ts`; `src/components/ui/button.tsx` exists.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/0003_seed_products.sql` | Seed ~12 football products + 3D metadata |
| `src/lib/products/types.ts` | Shared `Product`, `ProductCategory`, `ProductFilters` types |
| `src/lib/products/getProducts.ts` | Extend: accept filters (category, min/max price) |
| `src/lib/products/getProductById.ts` | Fetch one product by id |
| `src/lib/products/filterParams.ts` | Parse/serialize URL search params ↔ `ProductFilters` |
| `src/components/products/ProductCard.tsx` | Single product card |
| `src/components/products/ProductGrid.tsx` | Responsive grid of cards |
| `src/components/products/CategoryFilter.tsx` | Category filter links (client) |
| `src/app/page.tsx` | Catalog home (SSR) — replaces scaffold page |
| `src/app/productos/[id]/page.tsx` | Product detail (SSR) + generateMetadata |
| `src/app/layout.tsx` | Update metadata (title/description) + header |
| `tests/lib/products/getProducts.test.ts` | Extend: filter tests |
| `tests/lib/products/filterParams.test.ts` | Param parse/serialize tests |
| `tests/e2e/catalog.spec.ts` | E2E: catalog renders, filter works, detail navigates |

---

## Task 1: Seed product data

**Files:**
- Create: `supabase/migrations/0003_seed_products.sql`

- [ ] **Step 1: Write the seed migration**

~12 realistic football products across all 4 categories (`uniforme`, `zapato`, `balon`, `merchandising`), with prices in COP-appropriate magnitudes (numeric). Insert a matching `product_3d` row (placeholder Higgsfield URLs are fine — real assets come in Fase 2). Use deterministic SKUs. Example shape:

```sql
insert into products (name, sku, price, description, category) values
  ('Camiseta Selección Colombia 2026 Local', 'UNI-COL-001', 349900, 'Camiseta oficial local, tecnología Dri-FIT.', 'uniforme'),
  ('Camiseta Argentina Visitante 2026', 'UNI-ARG-001', 339900, 'Edición mundialista visitante.', 'uniforme'),
  ('Botines Nike Mercurial Vapor 16', 'ZAP-NIK-001', 899900, 'Botines de césped firme, ligeros.', 'zapato'),
  ('Botines Adidas Predator Elite', 'ZAP-ADI-001', 949900, 'Control y precisión en cada toque.', 'zapato'),
  ('Balón Oficial Mundial 2026', 'BAL-FIFA-001', 219900, 'Balón térmico oficial del torneo.', 'balon'),
  ('Balón Champions League Pro', 'BAL-UCL-001', 189900, 'Réplica profesional.', 'balon'),
  ('Bufanda Selección Colombia', 'MER-COL-001', 59900, 'Bufanda tejida de hincha.', 'merchandising'),
  ('Gorra Mundial 2026', 'MER-FIFA-001', 79900, 'Gorra ajustable edición mundial.', 'merchandising'),
  ('Camiseta Brasil Local 2026', 'UNI-BRA-001', 339900, 'Amarillo icónico.', 'uniforme'),
  ('Botines Puma Future 8', 'ZAP-PUM-001', 829900, 'Ajuste adaptativo.', 'zapato'),
  ('Balón Entrenamiento Pro', 'BAL-TRN-001', 99900, 'Resistente, para entrenar.', 'balon'),
  ('Termo Hincha Mundial', 'MER-TRM-001', 69900, 'Acero inoxidable 750ml.', 'merchandising')
on conflict (sku) do nothing;

insert into product_3d (product_id, model_url, background_url, lighting_preset)
select id, null, null, 'stadium' from products
on conflict (product_id) do nothing;
```

- [ ] **Step 2: Apply the migration**

Apply via Supabase MCP `apply_migration` (name `0003_seed_products`) OR if running locally with Supabase CLI, `supabase db push`. The controller has the Supabase MCP and project_id `xaffgvilsjkcpjmtreia` — if you are a subagent without MCP access, report NEEDS_CONTEXT and the controller will apply it.

- [ ] **Step 3: Verify rows exist**

Query via Supabase MCP `execute_sql`: `select category, count(*) from products group by category;`
Expected: 3 per category, 12 total.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_seed_products.sql
git commit -m "feat: seed football product catalog"
```

---

## Task 2: Product types + filtered getProducts (TDD)

**Files:**
- Create: `src/lib/products/types.ts`
- Modify: `src/lib/products/getProducts.ts`
- Modify: `tests/lib/products/getProducts.test.ts`

- [ ] **Step 1: Create shared types**

```typescript
// src/lib/products/types.ts
export const PRODUCT_CATEGORIES = ['uniforme', 'zapato', 'balon', 'merchandising'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  description: string | null
  category: ProductCategory
}

export type ProductFilters = {
  category?: ProductCategory
  minPrice?: number
  maxPrice?: number
}
```

- [ ] **Step 2: Write failing filter tests**

Add to `tests/lib/products/getProducts.test.ts`. The fake client must record the query chain calls so we can assert filters were applied. Replace the existing `fakeClient` with one supporting `.eq`, `.gte`, `.lte`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getProducts } from '@/lib/products/getProducts'

function fakeClient(rows: unknown[]) {
  const calls: { method: string; args: unknown[] }[] = []
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'gte', 'lte', 'order']) {
    builder[m] = (...args: unknown[]) => { calls.push({ method: m, args }); return builder }
  }
  // builder is thenable: awaiting it resolves to the result
  ;(builder as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve({ data: rows, error: null })
  const client = { from: () => builder, __calls: calls } as never
  return client
}

describe('getProducts filters', () => {
  it('applies category filter via eq', async () => {
    const client = fakeClient([])
    await getProducts(client, { category: 'balon' })
    expect((client as never as { __calls: { method: string; args: unknown[] }[] }).__calls)
      .toContainEqual({ method: 'eq', args: ['category', 'balon'] })
  })

  it('applies price range via gte/lte', async () => {
    const client = fakeClient([])
    await getProducts(client, { minPrice: 100, maxPrice: 500 })
    const calls = (client as never as { __calls: { method: string; args: unknown[] }[] }).__calls
    expect(calls).toContainEqual({ method: 'gte', args: ['price', 100] })
    expect(calls).toContainEqual({ method: 'lte', args: ['price', 500] })
  })

  it('maps rows and coerces price to number', async () => {
    const client = fakeClient([
      { id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: null, category: 'balon', created_at: 'x' },
    ])
    const result = await getProducts(client)
    expect(result).toEqual([
      { id: '1', name: 'Balón', sku: 'B-1', price: 50, description: null, category: 'balon' },
    ])
  })
})
```

- [ ] **Step 3: Run tests — confirm new ones FAIL**

Run: `npm test -- getProducts`
Expected: FAIL (getProducts doesn't accept filters / chain methods undefined).

- [ ] **Step 4: Implement filtered getProducts**

```typescript
// src/lib/products/getProducts.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product, ProductFilters } from './types'

export type { Product } from './types'

export async function getProducts(
  client: SupabaseClient<Database>,
  filters: ProductFilters = {},
): Promise<Product[]> {
  let query = client.from('products').select('*').order('created_at', { ascending: false })
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    description: row.description,
    category: row.category as Product['category'],
  }))
}
```

- [ ] **Step 5: Run tests — confirm PASS**

Run: `npm test -- getProducts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/products/ tests/lib/products/getProducts.test.ts
git commit -m "feat: add product filters to getProducts"
```

---

## Task 3: getProductById (TDD)

**Files:**
- Create: `src/lib/products/getProductById.ts`
- Create: `tests/lib/products/getProductById.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/lib/products/getProductById.test.ts
import { describe, it, expect } from 'vitest'
import { getProductById } from '@/lib/products/getProductById'

function fakeClient(row: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = () => builder
  builder.maybeSingle = () => Promise.resolve({ data: row, error })
  return { from: () => builder } as never
}

describe('getProductById', () => {
  it('returns mapped product when found', async () => {
    const client = fakeClient({ id: '1', name: 'Balón', sku: 'B-1', price: '50.00', description: 'x', category: 'balon', created_at: 't' })
    const result = await getProductById(client, '1')
    expect(result).toEqual({ id: '1', name: 'Balón', sku: 'B-1', price: 50, description: 'x', category: 'balon' })
  })

  it('returns null when not found', async () => {
    const client = fakeClient(null)
    expect(await getProductById(client, 'missing')).toBeNull()
  })
})
```

- [ ] **Step 2: Run — confirm FAIL**

Run: `npm test -- getProductById`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// src/lib/products/getProductById.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from './types'

export async function getProductById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<Product | null> {
  const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    sku: data.sku,
    price: Number(data.price),
    description: data.description,
    category: data.category as Product['category'],
  }
}
```

- [ ] **Step 4: Run — confirm PASS**

Run: `npm test -- getProductById`
Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/products/getProductById.ts tests/lib/products/getProductById.test.ts
git commit -m "feat: add getProductById helper"
```

---

## Task 4: Filter param parsing (TDD)

**Files:**
- Create: `src/lib/products/filterParams.ts`
- Create: `tests/lib/products/filterParams.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/lib/products/filterParams.test.ts
import { describe, it, expect } from 'vitest'
import { parseFilters } from '@/lib/products/filterParams'

describe('parseFilters', () => {
  it('parses category and prices from search params', () => {
    expect(parseFilters({ category: 'balon', minPrice: '100', maxPrice: '500' }))
      .toEqual({ category: 'balon', minPrice: 100, maxPrice: 500 })
  })

  it('ignores invalid category', () => {
    expect(parseFilters({ category: 'hacking' })).toEqual({})
  })

  it('ignores non-numeric prices', () => {
    expect(parseFilters({ minPrice: 'abc' })).toEqual({})
  })

  it('returns empty object for no params', () => {
    expect(parseFilters({})).toEqual({})
  })
})
```

- [ ] **Step 2: Run — confirm FAIL**

Run: `npm test -- filterParams`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// src/lib/products/filterParams.ts
import { PRODUCT_CATEGORIES, type ProductCategory, type ProductFilters } from './types'

type RawParams = Record<string, string | string[] | undefined>

function num(v: string | string[] | undefined): number | undefined {
  if (typeof v !== 'string') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function parseFilters(params: RawParams): ProductFilters {
  const filters: ProductFilters = {}
  const cat = params.category
  if (typeof cat === 'string' && (PRODUCT_CATEGORIES as readonly string[]).includes(cat)) {
    filters.category = cat as ProductCategory
  }
  const min = num(params.minPrice)
  const max = num(params.maxPrice)
  if (min !== undefined) filters.minPrice = min
  if (max !== undefined) filters.maxPrice = max
  return filters
}
```

- [ ] **Step 4: Run — confirm PASS**

Run: `npm test -- filterParams`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/products/filterParams.ts tests/lib/products/filterParams.test.ts
git commit -m "feat: add product filter param parsing"
```

---

## Task 5: ProductCard + ProductGrid components

**Files:**
- Create: `src/components/products/ProductCard.tsx`
- Create: `src/components/products/ProductGrid.tsx`

**Design mandate:** Apply high design quality (frontend-design / ui-ux-pro-max principles). Football/World-Cup energy — bold, modern, NOT generic AI card layout. Use a price formatter for COP (`Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`). Cards: clear hierarchy, category badge, hover state, accessible (semantic, alt text, focus rings). Responsive grid (1 col mobile → 2 → 3 → 4 at xl).

- [ ] **Step 1: ProductCard (Server Component, no client JS needed)**

```tsx
// src/components/products/ProductCard.tsx
import Link from 'next/link'
import type { Product } from '@/lib/products/types'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const categoryLabel: Record<Product['category'], string> = {
  uniforme: 'Uniforme',
  zapato: 'Botines',
  balon: 'Balón',
  merchandising: 'Merch',
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/productos/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/40">
        <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          {categoryLabel[product.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold leading-tight">{product.name}</h3>
        <p className="mt-auto pt-2 text-lg font-bold">{cop.format(product.price)}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: ProductGrid**

```tsx
// src/components/products/ProductGrid.tsx
import type { Product } from '@/lib/products/types'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No hay productos que coincidan con tu búsqueda.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors in these files.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/
git commit -m "feat: add ProductCard and ProductGrid components"
```

---

## Task 6: CategoryFilter component

**Files:**
- Create: `src/components/products/CategoryFilter.tsx`

- [ ] **Step 1: Implement (Client Component — uses pathname/search params for active state)**

```tsx
// src/components/products/CategoryFilter.tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { PRODUCT_CATEGORIES } from '@/lib/products/types'
import { cn } from '@/lib/utils'

const labels: Record<string, string> = {
  uniforme: 'Uniformes',
  zapato: 'Botines',
  balon: 'Balones',
  merchandising: 'Merch',
}

export function CategoryFilter() {
  const pathname = usePathname()
  const params = useSearchParams()
  const active = params.get('category')

  function hrefFor(category: string | null) {
    const next = new URLSearchParams(params.toString())
    if (category) next.set('category', category)
    else next.delete('category')
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const base =
    'rounded-full px-4 py-2 text-sm font-medium transition border'
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
      <Link
        href={hrefFor(null)}
        className={cn(base, !active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
      >
        Todos
      </Link>
      {PRODUCT_CATEGORIES.map((c) => (
        <Link
          key={c}
          href={hrefFor(c)}
          className={cn(base, active === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
        >
          {labels[c]}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/CategoryFilter.tsx
git commit -m "feat: add CategoryFilter component"
```

---

## Task 7: Catalog home page (SSR)

**Files:**
- Modify: `src/app/page.tsx` (replace scaffold)
- Modify: `src/app/layout.tsx` (metadata + header)

> **Next 16:** `searchParams` is an async prop (Promise). `await` it. Verify in `node_modules/next/dist/docs/`.

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { parseFilters } from '@/lib/products/filterParams'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filters = parseFilters(params)
  const supabase = await createClient()
  const products = await getProducts(supabase, filters)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tienda Mundial 2026</h1>
        <p className="mt-2 text-muted-foreground">Uniformes, botines, balones y merch oficial.</p>
      </header>
      <div className="mb-8">
        <CategoryFilter />
      </div>
      <ProductGrid products={products} />
    </main>
  )
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` metadata**

Set `export const metadata` title to `'Tienda Mundial 2026 | Fútbol'` and a description for SEO. Keep the existing font setup. Verify the scaffold's layout structure first (read it) before editing — preserve `<html>`/`<body>` and font classes.

- [ ] **Step 3: Manual smoke via dev server**

Run: `npm run dev`, open `http://localhost:3000`. Confirm 12 products render, clicking a category filters the grid (URL gets `?category=`). Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add catalog home page with filters"
```

---

## Task 8: Product detail page (SSR + SEO metadata)

**Files:**
- Create: `src/app/productos/[id]/page.tsx`

> **Next 16:** `params` is async (Promise). `await` it. `generateMetadata` receives the same async params.

- [ ] **Step 1: Implement**

```tsx
// src/app/productos/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/products/getProductById'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const product = await getProductById(supabase, id)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} | Tienda Mundial 2026`,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const product = await getProductById(supabase, id)
  if (!product) notFound()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Volver al catálogo
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/40" />
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {product.category}
          </span>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold">{cop.format(product.price)}</p>
          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Manual smoke**

Run: `npm run dev`. From the catalog, click a product → detail renders with name, price, description. Visit a bad id `/productos/nope` → 404. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/app/productos/
git commit -m "feat: add product detail page with SEO metadata"
```

---

## Task 9: E2E catalog test

**Files:**
- Create: `tests/e2e/catalog.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/catalog.spec.ts
import { test, expect } from '@playwright/test'

test('catalog shows products and filters by category', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Tienda Mundial 2026/i })).toBeVisible()
  // at least one product card links to a detail page
  const firstCard = page.locator('a[href^="/productos/"]').first()
  await expect(firstCard).toBeVisible()

  // filter by Balones
  await page.getByRole('link', { name: 'Balones' }).click()
  await expect(page).toHaveURL(/category=balon/)
})

test('product detail page renders', async ({ page }) => {
  await page.goto('/')
  await page.locator('a[href^="/productos/"]').first().click()
  await expect(page).toHaveURL(/\/productos\//)
  await expect(page.getByRole('link', { name: /Volver al catálogo/i })).toBeVisible()
})
```

- [ ] **Step 2: Run**

Run: `npx playwright test catalog`
Expected: 2 passed. (Requires seed data from Task 1 applied to the live DB and `.env.local` set.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/catalog.spec.ts
git commit -m "test: add catalog e2e test"
```

---

## Self-Review

- **Spec coverage:** Catalog listing SSR (Task 7), filters category+price (Task 2, 4, 6, 7), product detail + SEO metadata (Task 8), seed data (Task 1), data helpers tested (Task 2-4), components (Task 5-6), E2E (Task 9). Maps to design doc "Productos: CRUD básico, listado SSR, búsqueda/filtros".
- **Placeholder scan:** No TBD. All code present. 3D viewer is intentionally a styled placeholder box here — real Higgsfield 3D is Fase 2 (separate plan), not this plan.
- **Type consistency:** `Product`/`ProductCategory`/`ProductFilters` defined in `types.ts` (Task 2), imported consistently by getProducts, getProductById, filterParams, ProductCard, ProductGrid, CategoryFilter, pages. `getProducts(client, filters)` signature matches usage in page.tsx. `parseFilters(params)` returns `ProductFilters` consumed by `getProducts`.
- **Note:** Tasks 1 (seed) and 9 (e2e) depend on Supabase MCP / live DB — controller applies the seed migration if the implementer subagent lacks MCP access.
