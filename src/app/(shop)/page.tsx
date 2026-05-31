import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/products/getProducts'
import { parseFilters } from '@/lib/products/filterParams'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'

type SearchParams = Record<string, string | string[] | undefined>

export default async function CatalogPage({
  searchParams,
}: {
  // Next.js 16: searchParams is async (a Promise) and must be awaited.
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = parseFilters(params)
  const supabase = await createClient()
  const products = await getProducts(supabase, filters)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-border pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Catálogo oficial
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tienda Mundial 2026
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Uniformes, botines, balones y merch oficial. Vive el Mundial con la
          equipación de tu selección.
        </p>
      </header>

      <div className="mb-8 flex items-center justify-between gap-4">
        <Suspense
          fallback={<div className="h-10 w-full max-w-md animate-pulse rounded-full bg-muted" />}
        >
          <CategoryFilter />
        </Suspense>
        <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      <ProductGrid products={products} />
    </main>
  )
}
