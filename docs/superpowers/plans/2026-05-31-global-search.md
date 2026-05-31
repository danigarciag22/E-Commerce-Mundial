# Global Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A storefront search: a search box in the header that takes a query to `/buscar?q=…`, and a results page that shows matching active products (by name, SKU, or description).

**Architecture:** A pure, tested `buildSearchOr(q)` sanitizes the query and builds the Supabase `.or(...)` filter string (guards against `,`/`(`/`)` that would break `.or` syntax). `searchProducts(client, q)` runs an `ilike` search over active products. The results page (`/buscar`, Server Component, SSR for shareable URLs) reads `?q=` and renders the existing `ProductGrid`. A client `SearchBar` in the header pushes to `/buscar?q=`.

**Tech Stack:** Next.js 16, TypeScript, Supabase (`ilike`/`.or`), Tailwind/shadcn, Vitest, Playwright.

> **Existing (use, do NOT recreate):**
> - `src/lib/supabase/server.ts` (`createClient`), `src/lib/products/types.ts` (`Product`), `src/components/products/ProductGrid.tsx`.
> - `products` has `active`. Public read RLS.
> - `src/components/storefront/SiteHeader.tsx` — add the SearchBar here.
> - `cn` at `src/lib/utils.ts`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/products/buildSearchOr.ts` | pure: sanitize q → supabase `.or` string |
| `tests/lib/products/buildSearchOr.test.ts` | tests |
| `src/lib/products/searchProducts.ts` | run the ilike search (active only) |
| `src/components/storefront/SearchBar.tsx` | header search input (client) |
| `src/app/(shop)/buscar/page.tsx` | results page (SSR) |
| `src/components/storefront/SiteHeader.tsx` | embed SearchBar |
| `tests/e2e/search.spec.ts` | E2E |

---

## Task 1: buildSearchOr (TDD, pure)

**Files:**
- Create: `tests/lib/products/buildSearchOr.test.ts`, `src/lib/products/buildSearchOr.ts`

- [ ] **Step 1: Failing test**

```typescript
// tests/lib/products/buildSearchOr.test.ts
import { describe, it, expect } from 'vitest'
import { buildSearchOr } from '@/lib/products/buildSearchOr'

describe('buildSearchOr', () => {
  it('builds an ilike OR across name, sku, description', () => {
    expect(buildSearchOr('balon')).toBe('name.ilike.%balon%,sku.ilike.%balon%,description.ilike.%balon%')
  })
  it('trims and lowercases the term', () => {
    expect(buildSearchOr('  Balón  ')).toBe('name.ilike.%balón%,sku.ilike.%balón%,description.ilike.%balón%')
  })
  it('strips characters that break .or syntax (commas, parens)', () => {
    expect(buildSearchOr('a,b(c)')).toBe('name.ilike.%abc%,sku.ilike.%abc%,description.ilike.%abc%')
  })
  it('returns empty string for blank query', () => {
    expect(buildSearchOr('   ')).toBe('')
    expect(buildSearchOr('')).toBe('')
  })
})
```

- [ ] **Step 2: Run — FAIL** (`npm test -- buildSearchOr`).
- [ ] **Step 3: Implement**

```typescript
// src/lib/products/buildSearchOr.ts
// Sanitizes a user query and builds the Supabase `.or` filter string for an
// ilike search across name, sku, description. Strips chars that break .or syntax.
export function buildSearchOr(query: string): string {
  const term = query.trim().toLowerCase().replace(/[,()%]/g, '')
  if (!term) return ''
  return `name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`
}
```

- [ ] **Step 4: Run — PASS** (4 tests). **Step 5: Commit** `feat: add search filter builder`.

---

## Task 2: searchProducts

**Files:**
- Create: `src/lib/products/searchProducts.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/products/searchProducts.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from './types'
import { buildSearchOr } from './buildSearchOr'

export async function searchProducts(client: SupabaseClient<Database>, query: string): Promise<Product[]> {
  const or = buildSearchOr(query)
  if (!or) return []
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('active', true)
    .or(or)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.id, name: p.name, sku: p.sku, price: Number(p.price),
    description: p.description, category: p.category as Product['category'],
    stock: Number(p.stock), active: p.active,
  }))
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean. **Step 3: Commit** `feat: add product search`.

---

## Task 3: SearchBar + header

**Files:**
- Create: `src/components/storefront/SearchBar.tsx`
- Modify: `src/components/storefront/SiteHeader.tsx`

- [ ] **Step 1: SearchBar (client)**

```tsx
// src/components/storefront/SearchBar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (term) router.push(`/buscar?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={submit} role="search" className="relative hidden flex-1 md:block">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  )
}
```

- [ ] **Step 2: Embed in SiteHeader**

Add `<SearchBar />` between the nav links and the right-side cart/account group, so the layout becomes: logo · nav · SearchBar (flex-1) · cart + account. Import it. Keep the existing structure; the search bar fills the middle space on md+.

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. **Step 4: Commit** `feat: add header search bar`.

---

## Task 4: Search results page

**Files:**
- Create: `src/app/(shop)/buscar/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/(shop)/buscar/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { searchProducts } from '@/lib/products/searchProducts'
import { ProductGrid } from '@/components/products/ProductGrid'

export const metadata: Metadata = { title: 'Buscar | Tienda Mundial 2026' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const supabase = await createClient()
  const products = query ? await searchProducts(supabase, query) : []

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {query ? `Resultados para “${query}”` : 'Buscar'}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? `${products.length} producto(s)` : 'Escribe en la barra de búsqueda para encontrar productos.'}
      </p>
      <div className="mt-8">
        {query && <ProductGrid products={products} />}
      </div>
    </main>
  )
}
```

(`ProductGrid` already shows an empty-state message when `products` is empty, so no-results is handled.)

- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: `/buscar?q=balón` lists balls; header search navigates + filters; `/buscar?q=zzzz` shows the empty state. Stop server, free port.
- [ ] **Step 3: Commit** `feat: add search results page`.

---

## Task 5: E2E

**Files:**
- Create: `tests/e2e/search.spec.ts`

- [ ] **Step 1: Write**

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test('header search returns matching products', async ({ page }) => {
  await page.goto('/')
  const box = page.getByRole('searchbox', { name: /Buscar productos/i })
  await box.fill('balón')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/buscar\?q=/)
  await expect(page.getByRole('heading', { name: /Resultados para/i })).toBeVisible()
  // at least one product card links to a detail page
  await expect(page.locator('a[href^="/productos/"]').first()).toBeVisible()
})

test('a nonsense query shows no results', async ({ page }) => {
  await page.goto('/buscar?q=zzzznotaproduct')
  await expect(page.getByText(/No hay productos/i)).toBeVisible()
})
```

> The empty-state text must match `ProductGrid`'s message ("No hay productos que coincidan con tu búsqueda."). If it differs, adjust the assertion to the real text.

- [ ] **Step 2: Run** — `npx playwright test search`; full suite pass/skip; port free.
- [ ] **Step 3: Commit** `test: add search e2e`.

---

## Self-Review

- **Spec coverage:** Header search box (Task 3) → results page (Task 4) over a tested, injection-safe filter (Tasks 1-2); E2E (Task 5).
- **Placeholder scan:** No TBD. Search is server-side `ilike` (active products only); full-text/ranking is YAGNI for this catalog size.
- **Type consistency:** `searchProducts` returns `Product[]` consumed by `ProductGrid`. `buildSearchOr` output feeds `.or`. SearchBar uses `useRouter`/`useSearchParams`.
- **Security:** Query sanitized (strips `,()%`) before building `.or` — no filter injection. Reads via public RLS (active products). No secrets.
