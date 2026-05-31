# Storefront Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring the customer-facing storefront up to the quality of the CRM: a real landing page (hero with a reserved slot for the future Higgsfield 3D video, featured collections, featured products), public collection pages, a shared storefront header (nav + cart + account) and footer — and fix the double-header that appears on `/admin`.

**Architecture:** Introduce a `(shop)` route group with a shared layout (header + footer) wrapping the storefront pages (home, productos, carrito, checkout). The root layout becomes minimal (html/body/fonts only) so `/admin` (its own shell) and auth pages render without storefront chrome. Public collections read via the existing public RLS (`collections`/`product_collections` readable by anyone). Home is server-rendered for SEO. The hero reserves a `<HeroMedia>` slot (gradient placeholder now; swap for the Higgsfield video later).

**Tech Stack:** Next.js 16 App Router (route groups), TypeScript, Tailwind v4, shadcn, Vitest, Playwright.

> **Existing (use, do NOT recreate):**
> - `src/app/layout.tsx` — root layout currently renders a global header (logo + CartButton + UserMenu). Becomes minimal; chrome moves to the shop layout.
> - `src/app/page.tsx` (catalog home), `src/app/productos/`, `src/app/carrito/`, `src/app/checkout/`, `src/app/login/`, `src/app/registro/`, `src/app/admin/`.
> - `src/components/cart/CartButton.tsx`, `src/components/auth/UserMenu.tsx`.
> - `src/lib/supabase/server.ts`, `getProducts`, `src/lib/products/placeholderImage.ts`.
> - `collections`/`product_collections` tables (public read), `getCollections` is admin-flavored (counts) — add a storefront `getPublicCollections` + `getCollectionProducts`.
> - `cn` at `src/lib/utils.ts`. COP formatter pattern.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/components/storefront/SiteHeader.tsx` | Storefront header (logo, nav incl. Colecciones, cart, account) |
| `src/components/storefront/SiteFooter.tsx` | Footer |
| `src/components/storefront/HeroMedia.tsx` | Hero media slot (placeholder for Higgsfield video) |
| `src/app/(shop)/layout.tsx` | Shop layout: header + children + footer |
| `src/app/(shop)/page.tsx` | Landing (moved from app/page.tsx, expanded) |
| `src/app/(shop)/productos/...` | moved |
| `src/app/(shop)/carrito/...`, `(shop)/checkout/...` | moved |
| `src/app/(shop)/colecciones/page.tsx` | Public collections index |
| `src/app/(shop)/colecciones/[slug]/page.tsx` | Collection products |
| `src/lib/collections/getPublicCollections.ts` | storefront collection reads |
| `src/app/layout.tsx` | slimmed to html/body/fonts |
| `tests/e2e/storefront.spec.ts` | nav + collections e2e |

---

## Task 1: Route group + move storefront pages + slim root layout

**Files:** moves + `src/app/layout.tsx`, new `src/app/(shop)/layout.tsx`

> Route groups `(shop)` do NOT change URLs. `git mv` keeps history. Imports use the `@/` alias, so moving page files does not break imports.

- [ ] **Step 1: Create the group and move pages**

```bash
cd ~/developer/e-commerce
mkdir -p "src/app/(shop)"
git mv src/app/page.tsx "src/app/(shop)/page.tsx"
git mv src/app/productos "src/app/(shop)/productos"
git mv src/app/carrito "src/app/(shop)/carrito"
git mv src/app/checkout "src/app/(shop)/checkout"
```
(Leave `/login`, `/registro`, `/admin`, and `/api` where they are. Login/registro render with the minimal root layout — that's fine, they're standalone.)

- [ ] **Step 2: Slim the root layout**

Edit `src/app/layout.tsx`: keep `<html>`/`<body>`, fonts, and `metadata`, but REMOVE the `<header>` block (logo/CartButton/UserMenu) and the wrapping flex column that assumed a global header. Body should just render `{children}`. Keep `lang="es"`, font variables, `antialiased`, `bg-background text-foreground`.

- [ ] **Step 3: Create the shop layout with header + footer**

```tsx
// src/app/(shop)/layout.tsx
import { SiteHeader } from '@/components/storefront/SiteHeader'
import { SiteFooter } from '@/components/storefront/SiteFooter'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npm run build`. URLs unchanged: `/`, `/productos`, `/productos/[id]`, `/carrito`, `/checkout`, `/checkout/*` all still build. (SiteHeader/SiteFooter created next task — to keep the build green, create minimal stubs now or do Task 2 before building.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: add (shop) route group and slim root layout"
```

---

## Task 2: SiteHeader + SiteFooter

**Files:**
- Create: `src/components/storefront/SiteHeader.tsx`, `src/components/storefront/SiteFooter.tsx`

- [ ] **Step 1: SiteHeader (server component — reuses CartButton + UserMenu)**

Sticky, backdrop blur. Left: logo ("26" badge + "Tienda Mundial"). Center/nav: links Inicio (/), Productos (/), Colecciones (/colecciones). Right: `<CartButton/>` + `<UserMenu/>`. Mobile: collapse nav (keep logo + cart + account; nav links can wrap or hide on xs).

```tsx
// src/components/storefront/SiteHeader.tsx
import Link from 'next/link'
import { CartButton } from '@/components/cart/CartButton'
import { UserMenu } from '@/components/auth/UserMenu'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">26</span>
          <span>Tienda Mundial</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">Productos</Link>
          <Link href="/colecciones" className="hover:text-foreground">Colecciones</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: SiteFooter**

```tsx
// src/components/storefront/SiteFooter.tsx
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xs">
            <p className="flex items-center gap-2 font-bold">
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">26</span>
              Tienda Mundial
            </p>
            <p className="mt-2 text-sm text-muted-foreground">La equipación oficial del Mundial 2026. Envíos a todo Colombia.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tienda</span>
            <Link href="/" className="hover:text-foreground">Productos</Link>
            <Link href="/colecciones" className="hover:text-foreground">Colecciones</Link>
            <Link href="/carrito" className="hover:text-foreground">Carrito</Link>
          </nav>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Cuenta</span>
            <Link href="/login" className="hover:text-foreground">Iniciar sesión</Link>
            <Link href="/registro" className="hover:text-foreground">Registrarse</Link>
          </nav>
        </div>
        <p className="border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tienda Mundial. Proyecto demo. No afiliado a la FIFA.
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean (now the shop layout resolves). Smoke: `/` shows header + footer; `/admin` shows ONLY the CRM shell (no storefront header). Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add src/components/storefront/SiteHeader.tsx src/components/storefront/SiteFooter.tsx
git commit -m "feat: add storefront header and footer"
```

---

## Task 3: Public collections reads

**Files:**
- Create: `src/lib/collections/getPublicCollections.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/collections/getPublicCollections.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from '@/lib/products/types'

export type PublicCollection = { id: string; name: string; slug: string; description: string | null }

export async function getPublicCollections(client: SupabaseClient<Database>): Promise<PublicCollection[]> {
  const { data, error } = await client.from('collections').select('id, name, slug, description').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }))
}

export async function getCollectionBySlug(client: SupabaseClient<Database>, slug: string): Promise<PublicCollection | null> {
  const { data, error } = await client.from('collections').select('id, name, slug, description').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { id: data.id, name: data.name, slug: data.slug, description: data.description } : null
}

export async function getCollectionProducts(client: SupabaseClient<Database>, collectionId: string): Promise<Product[]> {
  const { data, error } = await client
    .from('product_collections')
    .select('products(*)')
    .eq('collection_id', collectionId)
  if (error) throw new Error(error.message)
  const rows = (data ?? [])
    .map((r) => (r as unknown as { products: Database['public']['Tables']['products']['Row'] | null }).products)
    .filter((p): p is Database['public']['Tables']['products']['Row'] => p != null)
    // only show active products in the storefront
    .filter((p) => p.active)
  return rows.map((p) => ({
    id: p.id, name: p.name, sku: p.sku, price: Number(p.price),
    description: p.description, category: p.category as Product['category'],
    stock: Number(p.stock), active: p.active,
  }))
}
```

> The nested embed `products(*)` shape may differ; if it doesn't parse, fetch product_ids from `product_collections` then `getProducts` filtered by `in('id', ids)`. Verify against generated types; keep it type-clean.

- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/collections/getPublicCollections.ts
git commit -m "feat: add public collection reads"
```

---

## Task 4: Public collection pages

**Files:**
- Create: `src/app/(shop)/colecciones/page.tsx`, `src/app/(shop)/colecciones/[slug]/page.tsx`

- [ ] **Step 1: Collections index**

```tsx
// src/app/(shop)/colecciones/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicCollections } from '@/lib/collections/getPublicCollections'

export const metadata: Metadata = { title: 'Colecciones | Tienda Mundial 2026' }

export default async function CollectionsPage() {
  const supabase = await createClient()
  const collections = await getPublicCollections(supabase)
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Colecciones</h1>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} href={`/colecciones/${c.slug}`}
            className="group flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-card to-muted/40 p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colección</span>
            <div>
              <h2 className="text-xl font-bold">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
              <span className="mt-4 inline-block text-sm font-medium text-primary">Ver productos →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Collection detail**

```tsx
// src/app/(shop)/colecciones/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCollectionBySlug, getCollectionProducts } from '@/lib/collections/getPublicCollections'
import { ProductGrid } from '@/components/products/ProductGrid'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const c = await getCollectionBySlug(supabase, slug)
  return { title: c ? `${c.name} | Tienda Mundial 2026` : 'Colección' }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const collection = await getCollectionBySlug(supabase, slug)
  if (!collection) notFound()
  const products = await getCollectionProducts(supabase, collection.id)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/colecciones" className="text-sm text-muted-foreground hover:underline">← Colecciones</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{collection.name}</h1>
      {collection.description && <p className="mt-2 text-muted-foreground">{collection.description}</p>}
      <div className="mt-8"><ProductGrid products={products} /></div>
    </main>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: `/colecciones` lists 5 collections; clicking "Colombia" shows its products; bad slug → 404. Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shop)/colecciones"
git commit -m "feat: add public collection pages"
```

---

## Task 5: Landing page (hero + featured)

**Files:**
- Create: `src/components/storefront/HeroMedia.tsx`
- Modify: `src/app/(shop)/page.tsx`

- [ ] **Step 1: HeroMedia (placeholder for the future Higgsfield 3D video)**

```tsx
// src/components/storefront/HeroMedia.tsx
// Placeholder for the Higgsfield 3D-style hero video (Fase 2). Swap the inner
// gradient block for a <video> once the asset exists. See docs/3D-ASSETS.md.
export function HeroMedia() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-card to-muted/40 lg:aspect-square">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_16px)]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="rounded-full bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur">Video 3D próximamente</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Landing page** — keep the existing catalog (filters + grid) BELOW a new hero + featured collections strip.

Replace `src/app/(shop)/page.tsx` with: a hero section (headline "Vive el Mundial 2026", subcopy, CTA buttons "Ver productos" → `#catalogo` and "Colecciones" → `/colecciones`, `<HeroMedia/>` on the side), then a "Colecciones destacadas" strip (first 4 from `getPublicCollections`, linking to each), then the existing catalog section (CategoryFilter + ProductGrid from `getProducts(filters)`) under an `id="catalogo"` heading. Preserve the existing `searchParams`-driven filtering exactly (await searchParams, parseFilters, getProducts). Reuse `CategoryFilter`, `ProductGrid`, `parseFilters`.

Structure:
```tsx
// src/app/(shop)/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { parseFilters } from '@/lib/products/filterParams'
import { getPublicCollections } from '@/lib/collections/getPublicCollections'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { HeroMedia } from '@/components/storefront/HeroMedia'

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const filters = parseFilters(params)
  const supabase = await createClient()
  const [products, collections] = await Promise.all([
    getProducts(supabase, filters),
    getPublicCollections(supabase),
  ])

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">Mundial 2026</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Vive el Mundial con la camiseta puesta</h1>
          <p className="text-lg text-muted-foreground">Uniformes, botines, balones y merch oficial de tu selección. Envíos a todo Colombia.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="#catalogo" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Ver productos</Link>
            <Link href="/colecciones" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">Colecciones</Link>
          </div>
        </div>
        <HeroMedia />
      </section>

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Colecciones destacadas</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/colecciones/${c.slug}`} className="rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Colección</span>
                <p className="mt-1 font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight">Catálogo</h2>
        <div className="my-6"><CategoryFilter /></div>
        <ProductGrid products={products} />
      </section>
    </>
  )
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build` clean. Smoke: `/` shows hero + featured collections + catalog; category filter still works (`?category=balon`); anchor "Ver productos" jumps to catalog. Stop server, free port.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shop)/page.tsx" src/components/storefront/HeroMedia.tsx
git commit -m "feat: add landing hero and featured collections"
```

---

## Task 6: E2E storefront

**Files:**
- Create: `tests/e2e/storefront.spec.ts`

- [ ] **Step 1: Write**

```typescript
// tests/e2e/storefront.spec.ts
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
```

- [ ] **Step 2: Run** — `npx playwright test storefront` (needs seed collections — present). Full suite pass/skip. Port free.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/storefront.spec.ts
git commit -m "test: add storefront e2e"
```

---

## Self-Review

- **Spec coverage:** Storefront chrome (header/footer) + double-header fix via `(shop)` group (Tasks 1-2); public collections (Tasks 3-4); landing hero + featured + Higgsfield video slot (Task 5); E2E (Task 6).
- **Placeholder scan:** No TBD. `HeroMedia` is an intentional placeholder for the Higgsfield video (documented, ties to docs/3D-ASSETS.md). Collection-products embed has a documented fallback.
- **Type consistency:** `PublicCollection`/`Product` reused; `getCollectionProducts` returns `Product[]` consumed by `ProductGrid`. Landing reuses `parseFilters`/`CategoryFilter`/`ProductGrid` unchanged so existing filter behavior + its e2e (catalog.spec) still pass — VERIFY catalog.spec still green after the move (URLs unchanged).
- **Security:** Collections/products read via public RLS (anon) — correct for a storefront. No admin/secret access. Only active products shown in collection pages.
- **Regression note:** Moving pages into `(shop)` keeps URLs, so `catalog.spec.ts`, `cart.spec.ts`, `auth.spec.ts` should stay green. Run the full e2e suite after Task 5.
